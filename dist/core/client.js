"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cryptography_1 = require("./cryptography");
const rp = __importStar(require("request-promise"));
const _ = __importStar(require("underscore"));
const qs = __importStar(require("querystring"));
class BTCPayClient {
    constructor(host, keypair, tokens) {
        this.host = host;
        this.kp = keypair;
        this.tokens = tokens == undefined ? {} : tokens;
        this.client_id = cryptography_1.Cryptography.get_sin_from_key(keypair);
        this.user_agent = 'node-btcpay';
        this.options = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Accept-Version': '2.0.0'
            },
            json: true
        };
    }
    pair_client(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const re = new RegExp('^\\w{7,7}$');
            if (!re.test(code)) {
                throw 'pairing code is not valid';
            }
            const payload = {
                id: this.client_id,
                pairingCode: code
            };
            try {
                const data = yield this.unsigned_request('/tokens', payload);
                const _data = data[0];
                const _res = {};
                _res[_data.facade] = _data.token;
                return _res;
            }
            catch (error) {
                throw error;
            }
        });
    }
    get_rates(currencyPairs, storeID) {
        return __awaiter(this, void 0, void 0, function* () {
            const _params = {
                currencyPairs,
                storeID
            };
            return this.signed_get_request('/rates', _params);
        });
    }
    create_invoice(payload, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const re = new RegExp('^[A-Z]{3,3}$');
            if (!re.test(payload['currency'])) {
                throw 'Currency is invalid';
            }
            if (isNaN(parseFloat(payload['price']))) {
                throw 'Price must be a float';
            }
            return this.signed_post_request('/invoices', payload, token);
        });
    }
    get_invoice(invoice_id, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signed_get_request('/invoices/' + invoice_id, token);
        });
    }
    get_invoices(params, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signed_get_request('/invoices', params, token);
        });
    }
    create_signed_headers(uri, payload) {
        return {
            'X-Identity': Buffer.from(this.kp.getPublic().encodeCompressed()).toString('hex'),
            'X-Signature': cryptography_1.Cryptography.sign(uri + payload, this.kp).toString('hex')
        };
    }
    signed_get_request(path, params, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const _token = token ? token : _.values(this.tokens)[0];
            const _params = params ? params : {};
            _params['token'] = _token;
            const _uri = this.host + path;
            const _payload = '?' + qs.stringify(_params);
            const _options = JSON.parse(JSON.stringify(this.options));
            _.extend(_options.headers, this.create_signed_headers(_uri, _payload));
            _options['uri'] = _uri;
            _options['qs'] = _params;
            try {
                const resp = yield rp.get(_options);
                return resp['data'];
            }
            catch (err) {
                throw err;
            }
        });
    }
    signed_post_request(path, payload, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const _token = token ? token : _.values(this.tokens)[0];
            payload['token'] = _token;
            const _uri = this.host + path;
            const _payload = JSON.stringify(payload);
            const _options = JSON.parse(JSON.stringify(this.options));
            _.extend(_options.headers, this.create_signed_headers(_uri, _payload));
            _options['uri'] = _uri;
            _options['body'] = payload;
            try {
                const resp = yield rp.post(_options);
                return resp['data'];
            }
            catch (err) {
                throw err;
            }
        });
    }
    unsigned_request(path, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const _uri = this.host + path;
            const _options = JSON.parse(JSON.stringify(this.options));
            if (payload) {
                _options['uri'] = _uri;
                _options['body'] = payload;
                try {
                    const resp = yield rp.post(_options);
                    return resp['data'];
                }
                catch (err) {
                    throw err;
                }
            }
            else {
                _options['uri'] = _uri;
                try {
                    const resp = yield rp.get(_options);
                    return resp['data'];
                }
                catch (err) {
                    throw err;
                }
            }
        });
    }
}
exports.BTCPayClient = BTCPayClient;
//# sourceMappingURL=client.js.map