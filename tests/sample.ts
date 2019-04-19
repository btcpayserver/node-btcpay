import * as btcpay from '../dist';

const keypair = btcpay.crypto.load_keypair(Buffer.from('', 'hex'));

const client = new btcpay.BTCPayClient('', keypair, { merchant: '' });

client
  .get_rates('BTC_USD', '')
  .then((rates) => console.log(rates))
  .catch((err) => console.log(err));
