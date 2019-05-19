import { Cryptography as myCrypto } from '../../src/core/cryptography';

const MY_PRIVATE_KEY = Buffer.from(
  '31eb31ecf1a640cd91e0a1105501f36235f8c7d51d67dcf74ccc968d74cb6b25',
  'hex',
);

describe('btcpay.core.cryptography', () => {
  it('should generate a keypair', () => {
    const kp = myCrypto.generate_keypair();
    const priv = kp.getPrivate();
    expect(priv).toBeDefined();
  });
  it('should load a keypair from Buffer', () => {
    const kp = myCrypto.load_keypair(MY_PRIVATE_KEY);
    const priv = kp.getPrivate();
    expect(priv).toBeDefined();
  });
  it('should get sin from key', () => {
    const kp = myCrypto.load_keypair(MY_PRIVATE_KEY);
    const sin = myCrypto.get_sin_from_key(kp);
    expect(sin).toBe('TfDnXWvj6bBhkduYiZnohg5qhtDu5VWohhw');
  });
  it('should sign a message', () => {
    const kp = myCrypto.load_keypair(MY_PRIVATE_KEY);
    const message = Buffer.from('Satoshi', 'utf8');
    const sig = myCrypto.sign(message, kp);
    expect(sig.toString('hex')).toBe(
      '304402205b0a505c180bddbd4a8836de0f2ac10b52b327d0e932352d28d170fb81517a' +
        '770220307ac2ec2134d81fd04df6a1662b0962ad1322209c2e45ff8af63d3f12e0d089',
    );
  });
});
