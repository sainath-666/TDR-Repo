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

async function submitTransaction(fn: string, ...args: string[]): Promise<string> {
  try {
    const contract = await getContract();
    const commit = await contract.submitAsync(fn, { arguments: args });
    return commit.getTransactionId();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new FabricError(fn, message);
  }
}

export async function createBond(params: FabricBondParams): Promise<string> {
  if (isFabricMockMode()) {
    logger.info('Mock Fabric: createBond', { tdrNumber: params.tdrNumber });
    return mockTxId();
  }

  return submitTransaction('CreateBond', JSON.stringify(params));
}

/** Register bond on ledger if missing (e.g. DB re-seeded while ledger retained). */
export async function ensureBondOnChain(params: FabricBondParams): Promise<string | undefined> {
  if (isFabricMockMode()) return mockTxId();

  const existing = await getBond(params.tdrNumber);
  if (existing) return undefined;

  logger.info('Backfilling bond on Fabric ledger', { tdrNumber: params.tdrNumber });
  try {
    return await createBond(params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already exists')) {
      logger.warn('Bond already on Fabric ledger', { tdrNumber: params.tdrNumber });
      return undefined;
    }
    throw err;
  }
}

export async function recordApproval(params: FabricApprovalParams): Promise<string> {
  if (isFabricMockMode()) {
    logger.info('Mock Fabric: recordApproval', {
      tdrNumber: params.tdrNumber,
      level: params.level,
      cerbosCallId: params.cerbosCallId,
    });
    return mockTxId();
  }

  return submitTransaction(
    'RecordApproval',
    params.tdrNumber,
    String(params.level),
    params.decision,
    params.employeeId,
    params.signatureHash,
    params.cerbosCallId,
    params.remarks,
  );
}

export async function mintCertificate(
  tdrNumber: string,
  certificateIpfsCid: string,
  commissionerSignatureHash: string,
): Promise<string> {
  if (isFabricMockMode()) {
    logger.info('Mock Fabric: mintCertificate', { tdrNumber, certificateIpfsCid });
    return mockTxId();
  }

  return submitTransaction(
    'MintCertificate',
    tdrNumber,
    certificateIpfsCid,
    commissionerSignatureHash,
  );
}

export async function getBond(tdrNumber: string): Promise<FabricBondState | null> {
  if (isFabricMockMode()) return null;

  try {
    const contract = await getContract();
    const result = await contract.evaluate('GetBond', { arguments: [tdrNumber] });
    return JSON.parse(decodeFabricPayload(result)) as FabricBondState;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('not found')) return null;
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
