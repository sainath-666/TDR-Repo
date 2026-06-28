type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = ['phone', 'aadhaar', 'password', 'token', 'secret', 'key'];

export function maskPhone(phone: string): string {
  if (phone.length < 4) return '****';
  return `****${phone.slice(-4)}`;
}

export function redactSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitive);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitive(value);
      }
    }
    return result;
  }
  return obj;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (level === 'debug' && process.env.NODE_ENV === 'production') return;

  const entry = {
    level,
    timestamp: new Date().toISOString(),
    service: 'apcrda-tdr',
    message,
    ...(meta ? (redactSensitive(meta) as Record<string, unknown>) : {}),
  };

  const output = JSON.stringify(entry);
  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      if (process.env.NODE_ENV !== 'production') {
        console.warn(output);
      }
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
