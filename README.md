# node-btcpay

## Install
```shell
npm install https://github.com/tanjalo/node-btcpay
```

## Private key generation
* Generate and save private key:
```js
const btcpay = require('btcpay')
const keypair = btcpay.crypto.generate_keypair()
console.log(keypair)

>>> <Key priv: XXXXXXX pub: null >
```

Store the value of "priv" in a save place, e.g. environment variables

## Pairing

After generating your private key, you have to pair your client with your BTCPay store:

* On BTCPay Server > Stores > Settings > Access Tokens > Create a new token, (leave PublicKey blank) > Request pairing
* Copy pairing code:
* Pair client to server and save returned token:
```js
const btcpay = require('btcpay')
const keypair = btcpay.crypto.load_keypair(new Buffer.from(<PRIVATEKEY>, 'hex'))
const client = new btcpay.BTCPayClient(<BTCPAYURL>, keypair)

// Pair client to server
client
  .pair_client(<PAIRINGCODE>)
  .then(res => console.log(res))
  .catch(err => console.log(err))

>>> { merchant: 'XXXXXX' }
```
Store the value of "merchant" in a save place, e.g. environment variables

## Recreating a client
After pairing your client to the store, you can recreate the client as needed and use it in your code
```js
const btcpay = require('btcpay')
const keypair = btcpay.crypto.load_keypair(new Buffer.from(<PRIVATEKEY>, 'hex'))

// Recreate client
const client = new btcpay.BTCPayClient(<BCTPAYURL>, keypair, {merchant: <MERCHANT>})
```

### Get rates
Fetches current rates from BitcoinAverage (using your BTCPayServer)
```js
client.get_rates('BTC_USD', <STOREID>)
  .then(rates => console.log(rates))
  .catch(err => console.log(err))
```
The first argument accepts a comma-separated list of currency pair.

### Create invoice
See [BitPay Invoice API documentation](https://bitpay.com/api#resource-Invoices)
```js
client.create_invoice({price: 20, currency: 'USD'})
  .then(invoice => console.log(invoice.url))
  .catch(err => console.log(err))
```

### Get invoice
```js
client.get_invoice(<invoice-id>)
  .then(invoice => console.log(invoice.status))
  .catch(err => console.log(err))
```