import { config } from '../config';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

async function getCryptoKey(): Promise<CryptoKey> {
  const secretBuffer = Buffer.from(config.AI_API_KEY_ENCRYPTION_SECRET, 'utf8');
  const derivedKeyBuffer = await crypto.subtle.digest('SHA-256', secretBuffer);
  return crypto.subtle.importKey(
    'raw',
    derivedKeyBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts an API key using AES-256-GCM via Web Crypto API.
 * @param apiKey The raw API key string.
 * @returns A string in the format "iv_hex:encrypted_hex".
 * @throws Error if encryption fails.
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(apiKey);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encodedData,
    );
    const encryptedHex = Buffer.from(encryptedBuffer).toString('hex');
    const ivHex = Buffer.from(iv).toString('hex');
    return `${ivHex}:${encryptedHex}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt API key.');
  }
}

/**
 * Decrypts an API key encrypted with encryptApiKey using Web Crypto API.
 * @param encryptedData The string in the format "iv_hex:encrypted_hex".
 * @returns The decrypted API key string.
 * @throws Error if decryption fails or format is invalid.
 */
export async function decryptApiKey(encryptedData: string): Promise<string> {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format. Expected iv:encrypted.');
    }
    const [ivHex, encryptedHex] = parts;
    const key = await getCryptoKey();
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length.');
    }
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted,
    );
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error: any) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt API key: ${error.message}`);
  }
}
