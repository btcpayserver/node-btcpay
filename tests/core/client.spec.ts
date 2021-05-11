import * as elliptic from 'elliptic';
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import { BTCPayClient } from '../../src/core/client';
import { Cryptography as myCrypto } from '../../src/core/cryptography';

const IGNORE_SANDBOX_ERROR = process.env['BTCPAY_IGNORE_SANDBOX_ERROR'];
const USER_NAME = 'test@example.com';
const PASSWORD = 'satoshinakamoto';
const URL = 'http://127.0.0.1:49392';

const MY_PRIVATE_KEY = Buffer.from(
  '31eb31ecf1a640c9d1e0a1105501f36235f8c7d51d67dcf74ccc968d74cb6b25',
  'hex',
);
let STORE_ID = '';
const WINDOW_WIDTH = 1920;
const WINDOW_HEIGHT = 1080;

let INVOICE_ID = '';
const HEADLESS = true;

const loginAndGetPairingCode = async (): Promise<{
  browser: Browser;
  page: Page;
  pairingCode: string;
}> => {
  const newTokenName = 'autotest ' + new Date().getTime();

  const browser = await puppeteer
    .launch({
      headless: HEADLESS,
      args: ['--window-size=' + WINDOW_WIDTH + ',' + WINDOW_HEIGHT],
    })
    .then(
      (v) => v, // if success, passthrough
      // if error, check for env and ignore sandbox and warn.
      (err) => {
        if (IGNORE_SANDBOX_ERROR === '1') {
          console.warn(
            'WARNING!!! Error occurred, Chromium will be started ' +
              "without sandbox. This won't guarantee success.",
          );
          return puppeteer.launch({
            headless: HEADLESS,
            ignoreDefaultArgs: ['--disable-extensions'],
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--window-size=' + WINDOW_WIDTH + ',' + WINDOW_HEIGHT,
            ],
          });
        } else {
          console.warn(
            'If "No usable sandbox!" error, retry test with ' +
              'BTCPAY_IGNORE_SANDBOX_ERROR=1',
          );
          throw err;
        }
      },
    );
  const page = (await browser.pages())[0];
  await page.setViewport({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
  try {
    await page.goto(URL + '/Account/Login');
  } catch (e) {
    if (e.message === `net::ERR_CONNECTION_REFUSED at ${URL}/Account/Login`) {
      browser.close();
      console.log(
        'Please start docker container locally:\n' +
          'docker run -p 127.0.0.1:49392:49392 junderw/btcpay-client-test-server',
      );
      return {
        page,
        browser,
        pairingCode: '',
      };
    }
    throw e;
  }

  await page.click('#LoginButton');
  await page.goto(URL + '/stores');
  await page.waitForSelector('#CreateStore');
  await page.click(
    'table.table.table-sm.table-responsive-md > tbody > ' +
      'tr:nth-of-type(1) > td:nth-of-type(3) > a:nth-of-type(2)',
  );
  await page.waitForSelector('#Id');
  const idElement = await page.$$('#Id');
  STORE_ID = (await idElement[0]
    .getProperty('value')
    .then((v) => v?.jsonValue())) as string;
  await page.goto(URL + '/stores/' + STORE_ID + '/Tokens/Create');
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
    if (el === null) {
      return '';
    }
    return el.innerHTML;
  });
  const pairingCode = (contents.match(
    /Server initiated pairing code: (\S{7})/,
  ) || [])[1];
  if (!pairingCode) {
    throw new Error('Could not get pairing code');
  }
  return {
    browser,
    page,
    pairingCode,
  };
};

let MY_KEYPAIR: elliptic.ec.KeyPair;
let client: BTCPayClient;
describe('btcpay.core.client', () => {
  beforeAll(async () => {
    jest.setTimeout(20000); // browser takes a while
    MY_KEYPAIR = myCrypto.load_keypair(MY_PRIVATE_KEY);
    client = new BTCPayClient(URL, MY_KEYPAIR);
  });

  it('should pair with server', async () => {
    const pairingData = await loginAndGetPairingCode();
    const myClient = new BTCPayClient(URL, MY_KEYPAIR);
    const result = await myClient.pair_client(pairingData.pairingCode);
    client = new BTCPayClient(URL, MY_KEYPAIR, result);
    expect(result.merchant).toBeDefined();
    pairingData.browser.close();
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
    INVOICE_ID = results.id;
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
        // @ts-ignore
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
