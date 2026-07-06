/** Normalize Cerbos PDP / health URLs from env (supports host:port or https://…). */
export function parseCerbosPdpUrl(raw = process.env.CERBOS_PDP_URL ?? 'localhost:3593'): {
  grpcHost: string;
  tls: boolean;
  healthUrl: string;
} {
  const trimmed = raw.trim().replace(/\/+$/, '');

  if (trimmed.startsWith('https://')) {
    const host = trimmed.slice('https://'.length);
    const grpcHost = host.includes(':') ? host : `${host}:443`;
    return {
      grpcHost,
      tls: process.env.CERBOS_PDP_TLS !== 'false',
      healthUrl: `${trimmed}/_cerbos/health`,
    };
  }

  if (trimmed.startsWith('http://')) {
    const host = trimmed.slice('http://'.length);
    const grpcHost = host.includes(':') ? host.replace(':3592', ':3593') : `${host}:3593`;
    return {
      grpcHost,
      tls: process.env.CERBOS_PDP_TLS === 'true',
      healthUrl: `${trimmed}/_cerbos/health`,
    };
  }

  const grpcHost = trimmed;
  const healthHost = grpcHost.replace(':3593', ':3592');
  const tls = process.env.CERBOS_PDP_TLS === 'true';

  return {
    grpcHost,
    tls,
    healthUrl: `http${tls ? 's' : ''}://${healthHost}/_cerbos/health`,
  };
}
