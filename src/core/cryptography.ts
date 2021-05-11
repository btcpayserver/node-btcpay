import * as elliptic from 'elliptic';
import * as bs58 from 'bs58';
import * as crypto from 'crypto';

const ec = new elliptic.ec('secp256k1');

export class Cryptography {
  public static generate_keypair(): elliptic.ec.KeyPair {
    const kp = ec.genKeyPair();
    return kp;
  }

  public static load_keypair(
    buf: Buffer | string | elliptic.ec.KeyPair,
  ): elliptic.ec.KeyPair {
    return ec.keyFromPrivate(buf);
  }

  public static get_sin_from_key(kp: elliptic.ec.KeyPair): string {
    const pk: crypto.BinaryLike = Buffer.from(
      kp.getPublic().encodeCompressed(),
    );
    const version: Buffer = Cryptography.get_version_from_compressed_key(pk);
    const checksum: Buffer = Cryptography.get_checksum_from_version(version);
    return bs58.encode(Buffer.concat([version, checksum]));
  }

  public static sign(
    message: crypto.BinaryLike,
    kp: elliptic.ec.KeyPair,
  ): Buffer {
    const digest = crypto.createHash('sha256').update(message).digest();
    return Buffer.from(kp.sign(digest).toDER());
  }

  private static get_version_from_compressed_key(
    pk: crypto.BinaryLike,
  ): Buffer {
    const sh2 = crypto.createHash('sha256').update(pk).digest();
    const rp = crypto.createHash('ripemd160').update(sh2).digest();

    return Buffer.concat([
      Buffer.from('0F', 'hex'),
      Buffer.from('02', 'hex'),
      rp,
    ]);
  }

  private static get_checksum_from_version(version: crypto.BinaryLike): Buffer {
    const h1 = crypto.createHash('sha256').update(version).digest();
    const h2 = crypto.createHash('sha256').update(h1).digest();

    return h2.slice(0, 4);
  }
}
