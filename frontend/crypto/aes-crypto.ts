import { aesEncrypt as aesEnc, aesDecrypt as aesDec } from 'eciesjs/dist/utils';

export class AesCrypto {
  private readonly secretKey: Buffer;

  constructor(key: Buffer) {
    this.secretKey = key;
  }

  encryptPayload(data: Buffer): Buffer {
    return aesEnc(this.secretKey, data);
  }

  decryptPayload(data: Buffer): Buffer {
    return aesDec(this.secretKey, data);
  }
}