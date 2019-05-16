/// <reference types="node" />
import * as elliptic from 'elliptic';
import * as crypto from 'crypto';
export declare class Cryptography {
    static generate_keypair(): elliptic.ec.KeyPair;
    static load_keypair(buf: Buffer | string | elliptic.ec.KeyPair): elliptic.ec.KeyPair;
    static get_sin_from_key(kp: elliptic.ec.KeyPair): string;
    static sign(message: crypto.BinaryLike, kp: elliptic.ec.KeyPair): Buffer;
    private static get_version_from_compressed_key;
    private static get_checksum_from_version;
}
