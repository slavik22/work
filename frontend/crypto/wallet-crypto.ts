import { Buffer } from 'buffer';
const ascii85 = require('ascii85');

interface WalletCryptoProvider {
  request(args: { method: string; params?: any[] }): Promise<any>;
}

export class WalletCrypto {
  private readonly encryptionScheme = 'x25519-xsalsa20-poly1305';
  private readonly walletAddress: string;
  private readonly provider: WalletCryptoProvider;

  constructor(address: string, provider: WalletCryptoProvider) {
    this.walletAddress = address;
    this.provider = provider;
  }

  async encryptData(input: Buffer): Promise<Buffer> {
    try {
      const publicKeyBase64 = await this.provider.request({
        method: 'eth_getEncryptionPublicKey',
        params: [this.walletAddress],
      });
      const publicKey = Buffer.from(publicKeyBase64, 'base64');

      const encrypted = await this.encryptWithMetaMask(publicKey, input);
      return Buffer.concat([
        Buffer.from(encrypted.ephemPublicKey, 'base64'),
        Buffer.from(encrypted.nonce, 'base64'),
        Buffer.from(encrypted.ciphertext, 'base64'),
      ]);
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  private async encryptWithMetaMask(publicKey: Buffer, data: Buffer): Promise<any> {
    const { encrypt } = await import('@metamask/eth-sig-util');
    return encrypt({
      publicKey: publicKey.toString('base64'),
      data: ascii85.encode(data).toString(), // Replaced ascii85 with base64
      version: this.encryptionScheme,
    });
  }

  async decryptData(encrypted: Buffer): Promise<Buffer> {
    try {
      const structured = {
        version: this.encryptionScheme,
        ephemPublicKey: encrypted.slice(0, 32).toString('base64'),
        nonce: encrypted.slice(32, 56).toString('base64'),
        ciphertext: encrypted.slice(56).toString('base64'),
      };

      const payload = `0x${Buffer.from(JSON.stringify(structured), 'utf8').toString('hex')}`;
      const decrypted = await this.provider.request({
        method: 'eth_decrypt',
        params: [payload, this.walletAddress],
      });
      return ascii85.decode(decrypted); // Replaced ascii85.decode with base64
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  async encryptText(text: string): Promise<Buffer> {
    return this.encryptData(Buffer.from(text, 'utf-8'));
  }
}