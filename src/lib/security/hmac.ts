import {
  createHash,
  createHmac,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from 'crypto';

function getHmacSecret(): string {
  const secret = process.env.HMAC_SECRET;
  if (!secret) throw new Error('HMAC_SECRET environment variable is not set');
  return secret;
}

function getAadhaarKey(): Buffer {
  const keyHex = process.env.AADHAAR_ENCRYPTION_KEY;
  if (!keyHex) throw new Error('AADHAAR_ENCRYPTION_KEY environment variable is not set');
  return Buffer.from(keyHex, 'hex');
}

export function generateApprovalSignature(
  employeeId: string,
  bondId: string,
  decision: string,
  timestamp: number,
): string {
  const message = `${employeeId}:${bondId}:${decision}:${timestamp}`;
  return createHmac('sha256', getHmacSecret()).update(message).digest('hex');
}

export function verifyApprovalSignature(
  employeeId: string,
  bondId: string,
  decision: string,
  timestamp: number,
  hash: string,
): boolean {
  try {
    const expected = generateApprovalSignature(employeeId, bondId, decision, timestamp);
    const expectedBuf = Buffer.from(expected, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    if (expectedBuf.length !== hashBuf.length) return false;
    return timingSafeEqual(expectedBuf, hashBuf);
  } catch {
    return false;
  }
}

export function hashAadhaar(aadhaarNumber: string): string {
  return createHash('sha256').update(aadhaarNumber).digest('hex');
}

export function encryptAadhaar(aadhaarNumber: string): string {
  const key = getAadhaarKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const encrypted = Buffer.concat([cipher.update(aadhaarNumber, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${nonce.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptAadhaar(encrypted: string): string {
  const [nonceB64, tagB64, ciphertextB64] = encrypted.split('.');
  if (!nonceB64 || !tagB64 || !ciphertextB64) {
    throw new Error('Invalid encrypted Aadhaar format');
  }
  const key = getAadhaarKey();
  const nonce = Buffer.from(nonceB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function maskAadhaar(aadhaarHash: string): string {
  return `XXXX-XXXX-${aadhaarHash.slice(-4)}`;
}
