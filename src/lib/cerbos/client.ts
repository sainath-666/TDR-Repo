import { GRPC } from '@cerbos/grpc';

let cerbosClient: GRPC | null = null;

export function getCerbosClient(): GRPC {
  if (!cerbosClient) {
    const url = process.env.CERBOS_PDP_URL ?? 'localhost:3593';
    const useTls = process.env.CERBOS_PDP_TLS === 'true';
    cerbosClient = new GRPC(url, { tls: useTls });
  }
  return cerbosClient;
}
