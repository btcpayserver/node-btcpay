import * as elliptic from 'elliptic';
import * as puppeteer from 'puppeteer';
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
  merchant: '96ukQNT5eoNwQyRjjpgbRMvbHa6iqAJ436Zu5gRVuWxf',
};

const INVOICE_ID = 'TRnwXeAkuLQihe22mJs7J4';

const loginAndGetPairingCode = async (): Promise<any> => {
  const newTokenName = 'autotest ' + new Date().getTime();

  const browser = await puppeteer.launch({ headless: true });
  const page = (await browser.pages())[0];
  await page.goto('https://testnet.demo.btcpayserver.org/Account/Login');

  await page.type('#Email', USER_NAME);
  await page.type('#Password', PASSWORD);
  await page.click('#LoginButton');
  await page.goto(
    'https://testnet.demo.btcpayserver.org/stores/HPPHFtqtsKsF3' +
      'KU18fBNwVGP64hicGoRynvQrC3R2Rkw/Tokens/Create',
  );
  await page.waitForSelector('input#Label');
  await page.waitForSelector('[type="submit"]');

  await page.type('#Label', newTokenName);
  await page.click('[type="submit"]');
  await page.waitForSelector('button[type="submit"]');
  await page.click('[type="submit"]');
  await page.waitForSelector('div.alert.alert-success.alert-dismissible');
  const contents = await page.evaluate(() => {
    const el = document.querySelector(
      'div.alert.alert-success.alert-dismissible',
    );
    if (el === null) return '';
    return el.innerHTML;
  });
  const pairingCode = (contents.match(
    /Server initiated pairing code: (\S{7})/,
  ) || [])[1];
  if (!pairingCode) throw new Error('Could not get pairing code');
  return {
    browser,
    page,
    pairingCode,
  };
};

const deleteTokenAndClose = async (
  browser: puppeteer.Browser,
  page: puppeteer.Page,
) => {
  await page.goto(
    'https://testnet.demo.btcpayserver.org/stores/HPPHFtqtsKsF3' +
      'KU18fBNwVGP64hicGoRynvQrC3R2Rkw/Tokens',
  );
  await page.waitForSelector('table.table.table-sm.table-responsive-md');

  const link = await page.evaluate(() => {
    const el = document.querySelector(
      'table.table.table-sm.table-responsive-md',
    );
    if (el === null) return '';
    const tbody = el.children[1];
    if (tbody === undefined) return '';
    const secondTr = Array.from(tbody.children).filter(tr => {
      return tr.children[0].textContent !== 'FOR TEST (DO NOT DELETE)';
    })[0];
    if (secondTr !== undefined) {
      return secondTr.children[1].children[1].attributes[0].nodeValue;
    } else {
      return '';
    }
  });

  if (link !== '') {
    await page.goto('https://testnet.demo.btcpayserver.org' + link);
    await page.waitForSelector('form > button.btn.btn-secondary.btn-danger');
    await page.click('[type="submit"]');
    await page.waitForSelector('div.alert.alert-success.alert-dismissible');
  }
  browser.close();
};

let MY_KEYPAIR: elliptic.ec.KeyPair;
let client: BTCPayClient;
describe('btcpay.core.client', () => {
  beforeAll(() => {
    jest.setTimeout(20000); // browser takes a while
    MY_KEYPAIR = myCrypto.load_keypair(MY_PRIVATE_KEY);
    client = new BTCPayClient(URL, MY_KEYPAIR, TOKENS);
  });

  it('should pair with server', async () => {
    const pairingData = await loginAndGetPairingCode();
    const myClient = new BTCPayClient(URL, MY_KEYPAIR);
    const result = await myClient.pair_client(pairingData.pairingCode);
    expect(result.merchant).toBeDefined();
    await deleteTokenAndClose(pairingData.browser, pairingData.page);
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
