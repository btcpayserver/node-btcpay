"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const elliptic = __importStar(require("elliptic"));
const bs58 = __importStar(require("bs58"));
const crypto = __importStar(require("crypto"));
const ec = new elliptic.ec('secp256k1');
class Cryptography {
    static generate_keypair() {
        const kp = ec.genKeyPair();
        return kp;
    }
    static load_keypair(buf) {
        return ec.keyFromPrivate(buf);
    }
    static get_sin_from_key(kp) {
        const pk = Buffer.from(kp.getPublic().encodeCompressed());
        const version = Cryptography.get_version_from_compressed_key(pk);
        const checksum = Cryptography.get_checksum_from_version(version);
        return bs58.encode(Buffer.concat([version, checksum]));
    }
    static sign(message, kp) {
        const digest = crypto
            .createHash('sha256')
            .update(message)
            .digest();
        return Buffer.from(kp.sign(digest).toDER());
    }
    static get_version_from_compressed_key(pk) {
        const sh2 = crypto
            .createHash('sha256')
            .update(pk)
            .digest();
        const rp = crypto
            .createHash('ripemd160')
            .update(sh2)
            .digest();
        return Buffer.concat([
            Buffer.from('0F', 'hex'),
            Buffer.from('02', 'hex'),
            rp
        ]);
    }
    static get_checksum_from_version(version) {
        const h1 = crypto
            .createHash('sha256')
            .update(version)
            .digest();
        const h2 = crypto
            .createHash('sha256')
            .update(h1)
            .digest();
        return h2.slice(0, 4);
    }
}
exports.Cryptography = Cryptography;
//# sourceMappingURL=cryptography.js.map