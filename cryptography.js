const crypto = require('crypto');

const EC = require('elliptic').ec,
  ec = new EC('secp256k1');

const bs58 = require('bs58');

const generate_keypair = function() {
  const kp = ec.genKeyPair();
  return kp;
};

const load_keypair = function(buf) {
  return ec.keyFromPrivate(buf);
};

const get_sin_from_key = function(kp) {
  const pk = Buffer.from(kp.getPublic().encodeCompressed());
  const version = get_version_from_compressed_key(pk);
  const checksum = get_checksum_from_version(version);
  return bs58.encode(Buffer.concat([version, checksum]));
};

const sign = function(message, kp) {
  const digest = crypto
    .createHash('sha256')
    .update(message)
    .digest();
  return Buffer.from(kp.sign(digest).toDER());
};

const get_version_from_compressed_key = function(pk) {
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
};

const get_checksum_from_version = function(version) {
  const h1 = crypto
    .createHash('sha256')
    .update(version)
    .digest();
  const h2 = crypto
    .createHash('sha256')
    .update(h1)
    .digest();

  return h2.slice(0, 4);
};

exports.generate_keypair = generate_keypair;
exports.load_keypair = load_keypair;
exports.get_sin_from_key = get_sin_from_key;
exports.sign = sign;
