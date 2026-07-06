import { FabricError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  disconnectFabric,
  getContract,
  isFabricMockMode,
  probeFabricConnection,
} from '@/lib/fabric/client';

export interface FabricBondParams {
  tdrNumber: string;
  surveyNumber: string;
  holderAadhaarHash: string;
  extentSqYds: number;
  ratio: string;
  ipfsDocCid: string;
}

export interface FabricApprovalParams {
  tdrNumber: string;
  level: number;
  decision: string;
  employeeId: string;
  signatureHash: string;
  cerbosCallId: string;
  remarks: string;
}

export interface FabricBondState {
  tdrNumber: string;
  status: string;
  surveyNumber: string;
  extentSqYds: number;
  ratio: string;
  certificateIpfsCid?: string;
  approvals: Array<{
    level: number;
    decision: string;
    employeeId: string;
    signatureHash: string;
    cerbosCallId: string;
    remarks: string;
    timestamp: string;
  }>;
}

function mockTxId(): string {
  return `mock-tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function decodeFabricPayload(result: Uint8Array): string {
  return new TextDecoder().decode(result);
}

function fabricErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isBondNotFoundError(message: string): boolean {
  return /not found/i.test(message);
}

function isBondAlreadyExistsError(message: string): boolean {
  return /already exists/i.test(message);
}

function isApprovalAlreadyRecordedError(message: string): boolean {
  return /already recorded/i.test(message);
}

function approvalAlreadyOnChain(
  bond: FabricBondState,
  params: FabricApprovalParams,
): boolean {
  return (
    bond.approvals?.some(
      (a) => a.level === params.level && a.decision === params.decision,
    ) ?? false
  );
}

async function submitTransaction(fn: string, ...args: string[]): Promise<string> {
  try {
    const contract = await getContract();
    const commit = await contract.submitAsync(fn, { arguments: args });
    return commit.getTransactionId();
  } catch (err) {
    throw new FabricError(fn, fabricErrorMessage(err));
  }
}

async function submitCreateBond(params: FabricBondParams): Promise<string> {
  if (isFabricMockMode()) {
    logger.info('Mock Fabric: createBond', { tdrNumber: params.tdrNumber });
    return mockTxId();
  }
  return submitTransaction('CreateBond', JSON.stringify(params));
}

/** Register bond on ledger if missing (safe across DB re-seeds and retries). */
export async function ensureBondOnChain(params: FabricBondParams): Promise<string | undefined> {
  if (isFabricMockMode()) return mockTxId();

  const existing = await getBond(params.tdrNumber);
  if (existing) return undefined;

  logger.info('Registering bond on Fabric ledger', { tdrNumber: params.tdrNumber });
  try {
    return await submitCreateBond(params);
  } catch (err) {
    const message = fabricErrorMessage(err);
    if (isBondAlreadyExistsError(message)) {
      logger.warn('Bond already on Fabric ledger', { tdrNumber: params.tdrNumber });
      return undefined;
    }
    throw err;
  }
}

/** Record approval on ledger; skips when the same level/decision is already present. */
export async function ensureRecordApproval(
  params: FabricApprovalParams,
): Promise<string | undefined> {
  if (isFabricMockMode()) {
    logger.info('Mock Fabric: recordApproval', {
      tdrNumber: params.tdrNumber,
      level: params.level,
      cerbosCallId: params.cerbosCallId,
    });
    return mockTxId();
  }

  const existing = await getBond(params.tdrNumber);
  if (existing && approvalAlreadyOnChain(existing, params)) {
    logger.warn('Approval already on Fabric ledger', {
      tdrNumber: params.tdrNumber,
      level: params.level,
      decision: params.decision,
    });
    return undefined;
  }

  try {
    return await submitTransaction(
      'RecordApproval',
      params.tdrNumber,
      String(params.level),
      params.decision,
      params.employeeId,
      params.signatureHash,
      params.cerbosCallId,
      params.remarks,
    );
  } catch (err) {
    const message = fabricErrorMessage(err);
    if (isApprovalAlreadyRecordedError(message)) {
      logger.warn('Approval already on Fabric ledger (chaincode)', {
        tdrNumber: params.tdrNumber,
        level: params.level,
      });
      return undefined;
    }
    throw err;
  }
}

/** Mint certificate on ledger; skips when certificate CID is already recorded. */
export async function ensureMintCertificate(
  tdrNumber: string,
  certificateIpfsCid: string,
  commissionerSignatureHash: string,
): Promise<string | undefined> {
  if (isFabricMockMode()) {
    logger.info('Mock Fabric: mintCertificate', { tdrNumber, certificateIpfsCid });
    return mockTxId();
  }

  const existing = await getBond(tdrNumber);
  if (existing?.certificateIpfsCid) {
    logger.warn('Certificate already on Fabric ledger', { tdrNumber });
    return undefined;
  }

  try {
    return await submitTransaction(
      'MintCertificate',
      tdrNumber,
      certificateIpfsCid,
      commissionerSignatureHash,
    );
  } catch (err) {
    const message = fabricErrorMessage(err);
    if (/already minted/i.test(message)) {
      logger.warn('Certificate already on Fabric ledger (chaincode)', { tdrNumber });
      return undefined;
    }
    throw err;
  }
}

/** @deprecated Use ensureRecordApproval — kept for callers that need a strict submit. */
export async function recordApproval(params: FabricApprovalParams): Promise<string> {
  const txId = await ensureRecordApproval(params);
  return txId ?? `ledger-synced-${params.tdrNumber}-L${params.level}`;
}

/** @deprecated Use ensureMintCertificate — kept for callers that need a strict submit. */
export async function mintCertificate(
  tdrNumber: string,
  certificateIpfsCid: string,
  commissionerSignatureHash: string,
): Promise<string> {
  const txId = await ensureMintCertificate(tdrNumber, certificateIpfsCid, commissionerSignatureHash);
  return txId ?? `ledger-synced-cert-${tdrNumber}`;
}

export async function getBond(tdrNumber: string): Promise<FabricBondState | null> {
  if (isFabricMockMode()) return null;

  try {
    const contract = await getContract();
    const result = await contract.evaluate('GetBond', { arguments: [tdrNumber] });
    return JSON.parse(decodeFabricPayload(result)) as FabricBondState;
  } catch (err) {
    const message = fabricErrorMessage(err);
    if (isBondNotFoundError(message)) return null;
    throw new FabricError('GetBond', message);
  }
}

export async function checkFabricHealth(): Promise<'ok' | 'mock' | 'error' | 'offline'> {
  if (isFabricMockMode()) return 'mock';
  const reachable = await probeFabricConnection();
  if (!reachable) return 'offline';
  try {
    await getContract();
    return 'ok';
  } catch {
    return 'error';
  }
}

export async function disconnect(): Promise<void> {
  await disconnectFabric();
}

export { isFabricMockMode };
