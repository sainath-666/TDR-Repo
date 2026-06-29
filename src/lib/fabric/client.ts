import * as crypto from 'crypto';
import * as fs from 'fs';
import * as grpc from '@grpc/grpc-js';
import { connect, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import path from 'path';
import { FabricError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const CHANNEL_NAME = process.env.FABRIC_CHANNEL_NAME ?? 'tdr-channel';
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE_NAME ?? 'tdr-bond-cc';
const MSP_ID = process.env.FABRIC_MSP_ID ?? 'APCRDAMSP';
const PEER_ENDPOINT = process.env.FABRIC_PEER_ENDPOINT ?? 'localhost:7051';
const TLS_HOSTNAME = process.env.FABRIC_TLS_HOSTNAME ?? 'peer0.apcrda';

let gatewayInstance: Gateway | null = null;
let grpcClient: grpc.Client | null = null;

function resolveFabricPath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

export function isFabricMockMode(): boolean {
  if (process.env.FABRIC_MOCK_MODE === 'true') return true;
  if (!process.env.FABRIC_CERT_PATH || !process.env.FABRIC_KEY_PATH) return true;
  return false;
}

function readFirstFile(dir: string): Buffer {
  const entries = fs.readdirSync(dir);
  if (entries.length === 0) {
    throw new FabricError('readCredentials', `No files in ${dir}`);
  }
  return fs.readFileSync(path.join(dir, entries[0]!));
}

async function readPrivateKey(keyPath: string): Promise<crypto.KeyObject> {
  const resolved = resolveFabricPath(keyPath);
  const keyPem = fs.existsSync(resolved) ? fs.readFileSync(resolved) : readFirstFile(resolved);
  return crypto.createPrivateKey(keyPem);
}

async function readCertificate(certPath: string): Promise<Buffer> {
  const resolved = resolveFabricPath(certPath);
  const certPem = fs.existsSync(resolved) ? fs.readFileSync(resolved) : readFirstFile(resolved);
  return certPem;
}

async function newGrpcClient(): Promise<grpc.Client> {
  const tlsCertPath = process.env.FABRIC_TLS_CERT_PATH;
  if (!tlsCertPath) {
    throw new FabricError('connect', 'FABRIC_TLS_CERT_PATH is not set');
  }

  const tlsRootCert = await readCertificate(tlsCertPath);
  const credentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(PEER_ENDPOINT, credentials, {
    'grpc.ssl_target_name_override': TLS_HOSTNAME,
    'grpc.default_authority': TLS_HOSTNAME,
  });
}

async function getGateway(): Promise<Gateway> {
  if (gatewayInstance) return gatewayInstance;

  const certPath = process.env.FABRIC_CERT_PATH;
  const keyPath = process.env.FABRIC_KEY_PATH;
  if (!certPath || !keyPath) {
    throw new FabricError('connect', 'FABRIC_CERT_PATH and FABRIC_KEY_PATH are required');
  }

  const cert = await readCertificate(certPath);
  const key = await readPrivateKey(keyPath);

  const identity: Identity = { mspId: MSP_ID, credentials: cert };
  const signer: Signer = signers.newPrivateKeySigner(key);

  grpcClient = await newGrpcClient();
  gatewayInstance = connect({
    client: grpcClient,
    identity,
    signer,
    evaluateOptions: () => ({ deadline: Date.now() + 15000 }),
    endorseOptions: () => ({ deadline: Date.now() + 15000 }),
    submitOptions: () => ({ deadline: Date.now() + 30000 }),
    commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
  });

  logger.info('Fabric Gateway connected', { peer: PEER_ENDPOINT, channel: CHANNEL_NAME });
  return gatewayInstance;
}

export async function getContract() {
  const gateway = await getGateway();
  const network = gateway.getNetwork(CHANNEL_NAME);
  return network.getContract(CHAINCODE_NAME);
}

export async function disconnectFabric(): Promise<void> {
  gatewayInstance?.close();
  grpcClient?.close();
  gatewayInstance = null;
  grpcClient = null;
}

export async function probeFabricConnection(): Promise<boolean> {
  if (isFabricMockMode()) return false;
  try {
    const healthUrl = process.env.FABRIC_PEER_HEALTH_URL ?? 'http://localhost:9443/healthz';
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}
