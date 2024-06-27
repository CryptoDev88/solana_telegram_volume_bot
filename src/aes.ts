import * as crypto from 'crypto';
import assert from 'assert';

export const aesCreateKey = (): string => {
    // Generate a secret key for encryption and decryption
    const key = crypto.randomBytes(32); // 32 bytes = 256 bits
    const iv = crypto.randomBytes(16); // 16 bytes = 128 bits

    const result = key.toString('base64') + ':' + iv.toString('base64');
    return result;
};

export const aesEncrypt = (plainText: string, secret: string): string => {
    const parts = secret.split(':');
    assert(parts.length == 2);
    const key = Buffer.from(parts[0], 'base64');
    const iv = Buffer.from(parts[1], 'base64');

    // Create an AES cipher object for encryption
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
};

export const aesDecrypt = (encryptedText: string, secret: string): string => {
    const parts = secret.split(':');
    assert(parts.length == 2);
    const key = Buffer.from(parts[0], 'base64');
    const iv = Buffer.from(parts[1], 'base64');

    // Create a new AES cipher object for decryption
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // Decrypt the encrypted message
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
