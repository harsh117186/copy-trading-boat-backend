import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes for aes-256
const ivLength = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encrypted: string): string {
  const [ivHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 4) {
    // If local part is too short, show only first and last character
    return local[0] + '*'.repeat(local.length - 2) + local.slice(-1) + '@' + domain;
  }
  return (
    local.slice(0, 1) +
    '*'.repeat(local.length - 3) +
    local.slice(-2) +
    '@' +
    domain
  );
} 