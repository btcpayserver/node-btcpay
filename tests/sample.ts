import * as btcpay from '../dist';
import { METHODS } from 'http';

const keypair = btcpay.crypto.load_keypair(Buffer.from('', 'hex'));

const client = new btcpay.BTCPayClient('', keypair, {
  merchant: '',
});

async function test() {
  try {
    const rates = await client.get_rates('BTC_EUR', '');
    console.log(JSON.stringify(rates));
  } catch (err) {
    console.log(err);
  }
}

test();
