import { encrypt as eciesEncrypt, decrypt as eciesDecrypt, PrivateKey as ECPrivateKey } from 'eciesjs';


export class EciesCrypto {
  private readonly privateKey: ECPrivateKey;

  constructor(secret: Buffer) {
    this.privateKey = new ECPrivateKey(secret);
  }

  static encryptWithPublicKey(pubKeyHex: string, data: Buffer): Buffer {
    return eciesEncrypt(pubKeyHex, data);
  }

  encryptData(data: Buffer): Buffer {
    return EciesCrypto.encryptWithPublicKey(this.getPublicKeyHex(), data);
  }

  decryptData(data: Buffer): Buffer {
    return eciesDecrypt(this.privateKey.toHex(), data);
  }

  getPublicKeyHex(): string {
    return this.privateKey.publicKey.toHex();
  }
}