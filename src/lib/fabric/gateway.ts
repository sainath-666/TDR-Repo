import { FabricError } from '@/lib/errors';
import { logger } from '@/lib/logger';

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

const useMock =
  process.env.FABRIC_MOCK_MODE === 'true' ||
  process.env.NODE_ENV === 'development' ||
  !process.env.FABRIC_CERT_PATH;

function mockTxId(): string {
  return `mock-tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function createBond(params: FabricBondParams): Promise<string> {
  if (useMock) {
    logger.info('Mock Fabric: createBond', { tdrNumber: params.tdrNumber });
    return mockTxId();
  }
  throw new FabricError('createBond', 'Fabric gateway not configured — set FABRIC_CERT_PATH');
}

export async function recordApproval(params: FabricApprovalParams): Promise<string> {
  if (useMock) {
    logger.info('Mock Fabric: recordApproval', {
      tdrNumber: params.tdrNumber,
      level: params.level,
      cerbosCallId: params.cerbosCallId,
    });
    return mockTxId();
  }
  throw new FabricError('recordApproval', 'Fabric gateway not configured');
}

export async function mintCertificate(
  tdrNumber: string,
  certificateIpfsCid: string,
  commissionerSignatureHash: string,
): Promise<string> {
  if (useMock) {
    logger.info('Mock Fabric: mintCertificate', { tdrNumber, certificateIpfsCid });
    return mockTxId();
  }
  throw new FabricError('mintCertificate', 'Fabric gateway not configured');
}

export async function getBond(_tdrNumber: string): Promise<FabricBondState | null> {
  if (useMock) return null;
  return null;
}

export async function disconnect(): Promise<void> {
  // No-op in mock mode
}
