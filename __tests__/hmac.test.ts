import {
  generateApprovalSignature,
  verifyApprovalSignature,
  hashAadhaar,
} from '@/lib/security/hmac';

describe('HMAC security module', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.HMAC_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.AADHAAR_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('generates and verifies approval signatures', () => {
    const ts = 1700000000000;
    const hash = generateApprovalSignature('DEO001', 'bond-123', 'APPROVED', ts);
    expect(verifyApprovalSignature('DEO001', 'bond-123', 'APPROVED', ts, hash)).toBe(true);
    expect(verifyApprovalSignature('DEO001', 'bond-123', 'REJECTED', ts, hash)).toBe(false);
  });

  it('hashes aadhaar consistently', () => {
    const hash1 = hashAadhaar('999999999999');
    const hash2 = hashAadhaar('999999999999');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
