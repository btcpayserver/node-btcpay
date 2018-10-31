let crypto = require('crypto')
let EC = require('elliptic').ec,
    ec = new EC('secp256k1');
let bs58 = require('bs58')

let generate_keypair = function () {
    let kp = ec.genKeyPair()
    return kp
}

let load_keypair = function (buf) {
    return ec.keyFromPrivate(buf)
}

let get_sin_from_key = function (kp) {
    let pk = Buffer.from(kp.getPublic().encodeCompressed())
    let version = get_version_from_compressed_key(pk)
    let checksum = get_checksum_from_version(version)
    return bs58.encode(Buffer.concat([version, checksum]))
}

let sign = function (message, kp) {
    let digest = crypto.createHash('sha256').update(message).digest()
    return Buffer.from(kp.sign(digest).toDER())
}

let get_version_from_compressed_key = function (pk) {
    let sh2 = crypto.createHash('sha256').update(pk).digest()
    let rp = crypto.createHash('ripemd160').update(sh2).digest()

    return Buffer.concat([Buffer.from('0F', 'hex'), Buffer.from('02', 'hex'), rp])
}

let get_checksum_from_version = function (version) {
    let h1 = crypto.createHash('sha256').update(version).digest()
    let h2 = crypto.createHash('sha256').update(h1).digest()

    return h2.slice(0, 4)
}

exports.generate_keypair = generate_keypair
exports.load_keypair = load_keypair
exports.get_sin_from_key = get_sin_from_key
exports.sign = sign