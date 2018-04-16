let _ = require('underscore')
let Promise = require('bluebird')
let crypto = require('./cryptography')
let qs = require('querystring')
let rp = require('request-promise')


// TODO: peer certificate verification
function BTCPayClient(host, keypair, tokens) {
    this.host = host
    this.kp = keypair
    this.tokens = tokens == undefined ? {} : tokens
    this.client_id = crypto.get_sin_from_key(keypair)
    this.user_agent = 'node-btcpay'
    this.options = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Accept-Version': '2.0.0'
        },
        json: true
    }
}


BTCPayClient.prototype._create_signed_headers = function (uri, payload) {
    return {
        'X-Identity': Buffer.from(this.kp.getPublic().encodeCompressed()).toString('hex'),
        'X-Signature': crypto.sign(uri + payload, this.kp).toString('hex')
    }
}


BTCPayClient.prototype._signed_get_request = function (path, params, token) {
    let _token = token ? token : _.values(this.tokens)[0]
    let _params = params ? params : {}
    _params['token'] = _token

    let _uri = this.host + path
    let _payload = '?' + qs.stringify(_params)
    let _options = JSON.parse(JSON.stringify(this.options))

    _.extend(_options.headers, this._create_signed_headers(_uri, _payload))
    _options['uri'] = _uri
    _options['qs'] = _params

    return rp.get(_options).then(resp => {
        return new Promise(function(resolve, reject) {
            resolve(resp['data'])
        })
    }).catch(err => {
        return new Promise(function(resolve, reject) {
            reject(err)
        })
    })
}


BTCPayClient.prototype._signed_post_request = function (path, payload, token) {
    let _token = token ? token : _.values(this.tokens)[0]
    payload['token'] = _token

    let _uri = this.host + path
    let _payload = JSON.stringify(payload)
    let _options = JSON.parse(JSON.stringify(this.options))

    _.extend(_options.headers, this._create_signed_headers(_uri, _payload))
    _options['uri'] = _uri
    _options['body'] = payload

    return rp.post(_options).then(resp => {
        return new Promise(function (resolve, reject) {
            resolve(resp['data'])
        })
    }).catch(err => {
        return new Promise(function (resolve, reject) {
            reject(err)
        })
    })
}


BTCPayClient.prototype._unsigned_request = function (path, payload) {
    let _uri = this.host + path
    let _options = JSON.parse(JSON.stringify(this.options))

    if (payload) {
        _options['uri'] = _uri
        _options['body'] = payload

        return rp.post(_options).then(resp => {
            return new Promise(function (resolve, reject) {
                resolve(resp['data'])
            })
        }).catch(err => {
            return new Promise(function (resolve, reject) {
                reject(err)
            })
        })
    } else {
        _options['uri'] = _uri

        return rp.get(_options).then(resp => {
            return new Promise(function (resolve, reject) {
                resolve(resp['data'])
            })
        }).catch(err => {
            return new Promise(function (resolve, reject) {
                reject(err)
            })
        })
    }
}


BTCPayClient.prototype.get_rates = function (crypto='BTC', store_id) {
    let _params = {cryptoCode: crypto}
    if (store_id) {
        _params['storeID'] = store_id
    }
    return this._signed_get_request('/rates/', _params)
}


BTCPayClient.prototype.get_rate = function (currency, crypto='BTC', store_id) {
    return this.get_rates(crypto, store_id).then(rates => {
        let rate = _.find(rates, rate => { return rate.code == currency.toUpperCase()})
        return new Promise(function (resolve, reject) {
            resolve(rate.rate)
        })
    })
}


BTCPayClient.prototype.create_invoice = function (payload, token) {
    let re = new RegExp('^[A-Z]{3,3}$')

    if (!re.test(payload['currency'])) {
        throw 'Currency is invalid'
    }

    if (isNaN(parseFloat(payload['price']))) {
        throw 'Price must be a float'
    }

    return this._signed_post_request('/invoices/', payload, token)
}


BTCPayClient.prototype.get_invoice = function (invoice_id, token) {
    return this._signed_get_request('/invoices/' + invoice_id, token)
}


BTCPayClient.prototype.pair_client = function (code) {
    let re = new RegExp('^\\w{7,7}$')

    if (!re.test(code)) {
        throw 'pairing code is not valid'
    }

    let payload = {id: this.client_id, pairingCode: code}

    return this._unsigned_request('/tokens', payload).then(data => {
        let _data = data[0]

        return new Promise(function (resolve, reject) {
            let _res = {}
            _res[_data.facade] = _data.token

            resolve(_res)
        })
    })
}

module.exports = BTCPayClient