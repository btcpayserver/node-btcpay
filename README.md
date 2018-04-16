# node-btcpay

## Install
```shell
npm install https://github.com/tanjalo/node-btcpay
```


## Pairing
* Generate and save private key:
```js
let btcpay = require('btcpay')
var keypair = btcpay.crypto.generate_keypair()
```
* Create client:
```js
var client = new btcpay.BTCPayClient('https://btcpayserverhostname', keypair)
```
* On BTCPay Server > Stores > Settings > Access Tokens > Create a new token, (leave PublicKey blank) > Request pairing
* Copy pairing code:
* Pair client to server and save returned token:
```js
client.pair_client(<pairing-code>).then(res => console.log(res))
>>> { merchant: '6gi59fB1LKxHuyY29m8tR6tRysWppk9TnuoM7wT77Las' }
```
* Recreate client:
```js
var client = new btcpay.BTCPayClient('https://btcpayserverhostname', keypair, {merchant: '6gi59fB1LKxHuyY29m8tR6tRysWppk9TnuoM7wT77Las'})
```


## Creating a client
```js
var client = new btcpay.BTCPayClient('https://btcpayserverhostname', keypair, {merchant: '6gi59fB1LKxHuyY29m8tR6tRysWppk9TnuoM7wT77Las'})
```


## Get rates
```js
client.get_rates().then(rates => console.log(rates))
```


## Create specific rate
```js
client.get_rate('USD').then(rate => console.log(rate))
```


## Create invoice
See BitPay API documentation: https://bitpay.com/api#resource-Invoices
```js
client.create_invoice({"price": 20, "currency": "USD"}).then(invoice => console.log(invoice.url))
```


## Get invoice
```js
client.get_invoice(<invoice-id>).then(invoice => console.log(invoice.status))
```


## Key Management
```js
var privateKey = keypair.getPrivate().toString('hex')
var keypair = btcpay.crypto.load_keypair(new Buffer(privateKey, "hex"))
```