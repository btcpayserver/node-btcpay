# node-btcpay

## Install
```shell
npm i btcpay
```

## Private key generation
* Generate and save private key:
```bash
$ node -p "require('btcpay').crypto.generate_keypair()"

>>> <Key priv: XXXXXXX pub: null >
```

Store the value of "priv" in a save place, e.g. environment variables

## Pairing

After generating your private key, you have to pair your client with your BTCPay store:

* On BTCPay Server > Stores > Settings > Access Tokens > Create a new token, (leave PublicKey blank) > Request pairing
* Copy pairing code:
* Pair client to server and save returned token:

```bash
# Replace the BTCPAY_XXX envirnoment variables with your values and run:

$ [space] BTCPAY_URL=https://mydomain.com/ BTCPAY_KEY=... BTCPAY_PAIRCODE=... node -e "const btcpay=require('btcpay'); new btcpay.BTCPayClient(process.env.BTCPAY_URL, btcpay.crypto.load_keypair(Buffer.from(process.env.BTCPAY_KEY, 'hex'))).pair_client(process.env.BTCPAY_PAIRCODE).then(console.log).catch(console.error)"

# (prepend the line with a space to prevent BTCPAY_KEY from being saved to your bash history)

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
