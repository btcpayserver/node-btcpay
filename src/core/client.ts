import { Cryptography as crypto } from './cryptography';
import * as rp from 'request-promise';
import * as _ from 'underscore';
import * as qs from 'querystring';
import * as elliptic from 'elliptic';
import { Invoice } from '../models/invoice';
import { Rate } from '../models/rate';

export interface IBTCPayClient {
  get_rates(currencyPairs, storeID): Promise<Rate[]>;
  create_invoice(payload: any, token?: any): Promise<Invoice>;
  get_invoice(invoice_id: string, token?: any): Promise<Invoice[]>;
  get_invoices(params: any, token?: any): Promise<Invoice[]>;
}

export class BTCPayClient implements IBTCPayClient {
  private host: string;
  private kp: elliptic.ec.KeyPair;
  private tokens: any;
  private client_id: string;
  private user_agent: string;
  private options: any;

  constructor(host: string, keypair: elliptic.ec.KeyPair, tokens: any) {
    this.host = host;
    this.kp = keypair;
    this.tokens = tokens == undefined ? {} : tokens;
    this.client_id = crypto.get_sin_from_key(keypair);
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

  public async pair_client(code) {
    const re = new RegExp('^\\w{7,7}$');

    if (!re.test(code)) {
      throw 'pairing code is not valid';
    }

    const payload = {
      id: this.client_id,
      pairingCode: code
    };

    try {
      const data = await this.unsigned_request('/tokens', payload);
      const _data = data[0];
      const _res = {};
      _res[_data.facade] = _data.token;
      return _res;
    } catch (error) {
      throw error;
    }
  }

  public async get_rates(currencyPairs, storeID): Promise<Rate[]> {
    const _params = {
      currencyPairs,
      storeID
    };

    return this.signed_get_request('/rates', _params);
  }

  public async create_invoice(payload: any, token?: any): Promise<Invoice> {
    const re = new RegExp('^[A-Z]{3,3}$');

    if (!re.test(payload['currency'])) {
      throw 'Currency is invalid';
    }

    if (isNaN(parseFloat(payload['price']))) {
      throw 'Price must be a float';
    }

    return this.signed_post_request('/invoices', payload, token) as Invoice;
  }

  public async get_invoice(
    invoice_id: string,
    token?: any
  ): Promise<Invoice[]> {
    return this.signed_get_request('/invoices/' + invoice_id, token);
  }

  public async get_invoices(params: any, token?: any): Promise<Invoice[]> {
    return this.signed_get_request('/invoices', params, token);
  }

  private create_signed_headers(uri: string, payload: string) {
    return {
      'X-Identity': Buffer.from(
        this.kp.getPublic().encodeCompressed()
      ).toString('hex'),
      'X-Signature': crypto.sign(uri + payload, this.kp).toString('hex')
    };
  }

  private async signed_get_request(
    path: string,
    params: any,
    token?: any
  ): Promise<any> {
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
      const resp = await rp.get(_options);
      return resp['data'];
    } catch (err) {
      throw err;
    }
  }

  private async signed_post_request(
    path: string,
    payload: any,
    token: any
  ): Promise<any> {
    const _token = token ? token : _.values(this.tokens)[0];
    payload['token'] = _token;

    const _uri = this.host + path;
    const _payload = JSON.stringify(payload);
    const _options = JSON.parse(JSON.stringify(this.options));

    _.extend(_options.headers, this.create_signed_headers(_uri, _payload));
    _options['uri'] = _uri;
    _options['body'] = payload;

    try {
      const resp = await rp.post(_options);
      return resp['data'];
    } catch (err) {
      throw err;
    }
  }

  private async unsigned_request(path: string, payload: any): Promise<any> {
    const _uri = this.host + path;
    const _options = JSON.parse(JSON.stringify(this.options));

    if (payload) {
      _options['uri'] = _uri;
      _options['body'] = payload;

      try {
        const resp = await rp.post(_options);
        return resp['data'];
      } catch (err) {
        throw err;
      }
    } else {
      _options['uri'] = _uri;

      try {
        const resp = await rp.get(_options);
        return resp['data'];
      } catch (err) {
        throw err;
      }
    }
  }
}
