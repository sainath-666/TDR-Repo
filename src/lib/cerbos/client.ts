import { GRPC } from '@cerbos/grpc';
import { parseCerbosPdpUrl } from './config';

let cerbosClient: GRPC | null = null;

export function getCerbosClient(): GRPC {
  if (!cerbosClient) {
    const { grpcHost, tls } = parseCerbosPdpUrl();
    cerbosClient = new GRPC(grpcHost, { tls });
  }
  return cerbosClient;
}
