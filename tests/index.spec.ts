import * as btcpay from '../src/index';

describe('btcpay.index', () => {
  it('should import', () => {
    expect(btcpay).toBeDefined();
    expect(btcpay.crypto).toBeDefined();
    expect(btcpay.BTCPayClient).toBeDefined();
  });
});
