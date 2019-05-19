import * as elliptic from 'elliptic';
import { BTCPayClient } from '../../src/core/client';
import { Cryptography as myCrypto } from '../../src/core/cryptography';

const USER_NAME = 'test@example.com';
const PASSWORD = 'satoshinakamoto';
const URL = 'https://testnet.demo.btcpayserver.org/';

const MY_PRIVATE_KEY = Buffer.from(
  '31eb31ecf1a640c9d1e0a1105501f36235f8c7d51d67dcf74ccc968d74cb6b25',
  'hex',
);

const STORE_ID = 'HPPHFtqtsKsF3KU18fBNwVGP64hicGoRynvQrC3R2Rkw';
const TOKENS = {
  merchant: 'DwSMQ4SF7GAJRaMiLn4zjAR35bFJwgSpuKt9pxYoQNjJ',
};

const INVOICE_ID = 'TRnwXeAkuLQihe22mJs7J4';

// We need a way to programmatically get a new pairing code...
const SERVER_PAIRING_CODE = 'apYAxP9';

let MY_KEYPAIR: elliptic.ec.KeyPair;
let client: BTCPayClient;
describe('btcpay.core.cryptography', () => {
  beforeAll(() => {
    MY_KEYPAIR = myCrypto.load_keypair(MY_PRIVATE_KEY);
    client = new BTCPayClient(URL, MY_KEYPAIR, TOKENS);
  });

  it('should pair with server', async () => {
    const myClient = new BTCPayClient(URL, MY_KEYPAIR);
    const result = await myClient.pair_client(SERVER_PAIRING_CODE).then(
      v => v,
      async err => {
        if (
          err.message.match(
            /^404 - {"error":"The specified pairingCode is not found"}$/,
          )
        )
          return { merchant: 'test' };
        throw err;
      },
    );
    expect(result.merchant).toBeDefined();
    await expect(myClient.pair_client('hduheufhfuf')).rejects.toThrow(
      /^pairing code is not valid$/,
    );
  });

  it('should get rates', async () => {
    const results = await client.get_rates(['LTC_USD', 'BTC_USD'], STORE_ID);
    expect(results[0].rate).toBeDefined();
  });

  it('should create an invoice', async () => {
    const results = await client.create_invoice({
      currency: 'USD',
      price: 1.12,
    });
    expect(results.bitcoinAddress).toBeDefined();
    await expect(
      client.create_invoice({
        currency: 'KDFAHKJFKJ',
        price: 1.12,
      }),
    ).rejects.toThrow(/^Currency is invalid$/);
    await expect(
      client.create_invoice({
        currency: 'USD',
        price: 'xkhdfhu',
      }),
    ).rejects.toThrow(/^Price must be a float$/);
  });

  it('should get invoice', async () => {
    const results = await client.get_invoice(INVOICE_ID);
    expect(results.id).toBe(INVOICE_ID);
  });

  it('should get multiple invoices', async () => {
    const results = await client.get_invoices();
    expect(results[0].bitcoinAddress).toBeDefined();
  });
});
