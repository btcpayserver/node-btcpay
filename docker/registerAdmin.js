const puppeteer = require('puppeteer')
const fs = require('fs')
const btcpay = require('btcpay')

const IGNORE_SANDBOX_ERROR = process.env['BTCPAY_IGNORE_SANDBOX_ERROR'];
const URL = 'http://127.0.0.1:49392';
const STORENAME = 'Test Store for testing';
const USER_NAME = 'test@example.com';
const PASSWORD = 'satoshinakamoto';
const WINDOW_WIDTH = 1920
const WINDOW_HEIGHT = 1080
const HEADLESS = true

// const sleep = ms => new Promise(r => setTimeout(r,ms))

function writeAddress(address, type) {
  fs.writeFileSync('/root/btcpay.address.' + type, address)
}

function writeTokens(tokens) {
  fs.writeFileSync('/root/btcpaytokens', tokens)
}

async function getElValue(page, qs) {
  const idElement = await page.$$(qs);
  return idElement[0]
    .getProperty('value')
    .then(v => v.jsonValue());
}

async function main() {
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: ['--window-size=' + WINDOW_WIDTH + ',' + WINDOW_HEIGHT],
  }).then(
    v => v, // if success, passthrough
    // if error, check for env and ignore sandbox and warn.
    err => {
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

  await page.goto(URL + '/Account/Register');

  // Set up admin account
  await page.type('#Email', USER_NAME);
  await page.type('#Password', PASSWORD);
  await page.type('#ConfirmPassword', PASSWORD);
  await page.click('#RegisterButton');
  await page.waitForSelector('#Stores');

  // On main screen, setup first store
  await page.click('#Stores');
  await page.waitForSelector('#CreateStore');
  await page.click('#CreateStore');
  await page.type('#Name', STORENAME);
  await page.click('#Create');
  await page.waitForSelector('#Id');
  const STORE_ID = await getElValue(page, '#Id');

  // Add new wallet
  await page.click('#ModifyBTC');
  await page.waitForSelector('#import-from-btn');
  await page.click('#import-from-btn');
  await page.waitForSelector('#nbxplorergeneratewalletbtn');
  await page.click('#nbxplorergeneratewalletbtn');
  await page.waitForSelector('#btn-generate');
  await page.evaluate(() => {
    document.querySelector('#SavePrivateKeys').click();
    document.querySelector('#btn-generate').click();
  });
  await page.waitForSelector('#confirm');
  await page.evaluate(() => {
    document.querySelector('#confirm').click();
    document.querySelector('#submit').click();
  });
  await page.waitForSelector('#PayJoinEnabled');

  // Enable PayJoin
  await page.evaluate(() => {
    document.querySelector('#PayJoinEnabled').click();
    document.querySelector('#Save').click();
  });
  const alertQS = 'div.alert.alert-success.alert-dismissible'
  await page.waitForSelector(alertQS);
  
  // Get first address and write to disk
  await page.click('#Wallets');
  const firstManageLinkQS = 'table.table.table-sm.table-responsive-md > tbody > ' +
    'tr:nth-of-type(1) > td:nth-of-type(4) > a:nth-of-type(1)'
  await page.waitForSelector(firstManageLinkQS);
  await page.click(firstManageLinkQS);
  await page.waitForSelector('#WalletReceive');
  await page.click('#WalletReceive');
  await page.waitForSelector('#generateButton');
  await page.click('#generateButton');
  await page.waitForSelector('#vue-address');
  const address = await getElValue(page, '#vue-address');
  writeAddress(address, 'p2wpkh');

  // On main screen, setup second store
  await page.goto(URL + '/stores');
  await page.waitForSelector('#CreateStore');
  await page.click('#CreateStore');
  await page.type('#Name', STORENAME + ' 2');
  await page.click('#Create');
  await page.waitForSelector('#Id');
  const STORE_ID2 = await getElValue(page, '#Id');

  // Add new wallet
  await page.click('#ModifyBTC');
  await page.waitForSelector('#import-from-btn');
  await page.click('#import-from-btn');
  await page.waitForSelector('#nbxplorergeneratewalletbtn');
  await page.click('#nbxplorergeneratewalletbtn');
  await page.waitForSelector('#btn-generate');
  await page.evaluate(() => {
    document.querySelector('#ScriptPubKeyType').value = 'SegwitP2SH';
    document.querySelector('#SavePrivateKeys').click();
    document.querySelector('#btn-generate').click();
  });
  await page.waitForSelector('#confirm');
  await page.evaluate(() => {
    document.querySelector('#confirm').click();
    document.querySelector('#submit').click();
  });
  await page.waitForSelector('#PayJoinEnabled');
  
  // Enable PayJoin
  await page.evaluate(() => {
    document.querySelector('#PayJoinEnabled').click();
    document.querySelector('#Save').click();
  });
  await page.waitForSelector(alertQS);
  
  // Get first address and write to disk
  await page.click('#Wallets');
  const secondManageLinkQS = 'table.table.table-sm.table-responsive-md > tbody > ' +
    'tr:nth-of-type(2) > td:nth-of-type(4) > a:nth-of-type(1)'
  await page.waitForSelector(secondManageLinkQS);
  await page.click(secondManageLinkQS);
  await page.waitForSelector('#WalletReceive');
  await page.click('#WalletReceive');
  await page.waitForSelector('#generateButton');
  await page.click('#generateButton');
  await page.waitForSelector('#vue-address');
  const address2 = await getElValue(page, '#vue-address');
  writeAddress(address2, 'p2shp2wpkh');

  const tokens = {};

  // Get token for store 1
  await page.goto(URL + '/stores/' + STORE_ID + '/Tokens/Create');
  await page.waitForSelector('input#Label');
  await page.waitForSelector('[type="submit"]');

  await page.type('#Label', 'token1');
  await page.click('[type="submit"]');
  await page.waitForSelector('button[type="submit"]');
  await page.click('[type="submit"]');
  await page.waitForSelector('div.alert.alert-success.alert-dismissible');
  const contents1 = await page.evaluate(() => {
    const el = document.querySelector(
      'div.alert.alert-success.alert-dismissible',
    );
    if (el === null) return '';
    return el.innerHTML;
  });
  const pairingCode1 = (contents1.match(
    /Server initiated pairing code: (\S{7})/,
  ) || [])[1];
  const kp1 = btcpay.crypto.generate_keypair()
  const client1 = new btcpay.BTCPayClient(URL, kp1)
  const token1 = await client1.pair_client(pairingCode1)
  tokens.p2wpkh = token1;

  // Get token for store 2
  await page.goto(URL + '/stores/' + STORE_ID2 + '/Tokens/Create');
  await page.waitForSelector('input#Label');
  await page.waitForSelector('[type="submit"]');

  await page.type('#Label', 'token2');
  await page.click('[type="submit"]');
  await page.waitForSelector('button[type="submit"]');
  await page.click('[type="submit"]');
  await page.waitForSelector('div.alert.alert-success.alert-dismissible');
  const contents2 = await page.evaluate(() => {
    const el = document.querySelector(
      'div.alert.alert-success.alert-dismissible',
    );
    if (el === null) return '';
    return el.innerHTML;
  });
  const pairingCode2 = (contents2.match(
    /Server initiated pairing code: (\S{7})/,
  ) || [])[1];
  const kp2 = btcpay.crypto.generate_keypair()
  const client2 = new btcpay.BTCPayClient(URL, kp2)
  const token2 = await client2.pair_client(pairingCode2)
  tokens.p2shp2wpkh = token2;
  tokens.privateKeys = {
    p2wpkh: kp1.getPrivate('hex'),
    p2shp2wpkh: kp2.getPrivate('hex'),
  }
  writeTokens(JSON.stringify(tokens))
}

main()
.then(() => {
  process.exit(0);
})
.catch(err => {
  console.error(err)
  process.exit(1);
});
