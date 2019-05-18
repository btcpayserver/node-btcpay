import * as elliptic from 'elliptic';
import * as qs from 'querystring';
import * as rp from 'request-promise';
import * as _ from 'underscore';
import { Cryptography as crypto } from './cryptography';
import { Invoice } from '../models/invoice';
import { Rate } from '../models/rate';

export class BTCPayClient {
  private clientId: string;
  private userAgent: string;
  private options: any;

  constructor(
    private host: string,
    private kp: elliptic.ec.KeyPair,
    private tokens: any = {},
  ) {
    this.clientId = crypto.get_sin_from_key(this.kp);
    this.userAgent = 'node-btcpay';
    this.options = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': this.userAgent,
        'X-Accept-Version': '2.0.0',
      },
      json: true,
    };
  }

  public async pair_client(code: string): Promise<any> {
    const re = new RegExp('^\\w{7,7}$');

    if (!re.test(code)) {
      throw 'pairing code is not valid';
    }

    const payload = {
      id: this.clientId,
      pairingCode: code,
    };

    return this.unsigned_request('/tokens', payload).then((data: any) => {
      const _data = data[0];
      const _res: any = {};
      _res[_data.facade] = _data.token;
      return _res;
    });
  }

  public async get_rates(
    currencyPairs: string[],
    storeID: string,
  ): Promise<Rate[]> {
    return this.signed_get_request('/rates', {
      currencyPairs,
      storeID,
    });
  }

  public async create_invoice(payload: any, token?: any): Promise<Invoice> {
    const re = new RegExp('^[A-Z]{3,3}$');

    if (!re.test(payload.currency)) {
      throw 'Currency is invalid';
    }

    if (isNaN(parseFloat(payload.price))) {
      throw 'Price must be a float';
    }

    return this.signed_post_request('/invoices', payload, token) as Promise<
      Invoice
    >;
  }

  public async get_invoice(invoiceId: string, token?: any): Promise<Invoice[]> {
    return this.signed_get_request('/invoices/' + invoiceId, token);
  }

  public async get_invoices(params: any, token?: any): Promise<Invoice[]> {
    return this.signed_get_request('/invoices', params, token);
  }

  private create_signed_headers(uri: string, payload: string) {
    return {
      'X-Identity': Buffer.from(
        this.kp.getPublic().encodeCompressed(),
      ).toString('hex'),
      'X-Signature': crypto.sign(uri + payload, this.kp).toString('hex'),
    };
  }

  private async signed_get_request(
    path: string,
    params: any = {},
    token: any = _.values(this.tokens)[0],
  ): Promise<any> {
    params.token = token;

    const _options = JSON.parse(JSON.stringify(this.options));

    const _uri = this.host + path;
    const _payload = '?' + qs.stringify(params);

    _.extend(_options.headers, this.create_signed_headers(_uri, _payload));
    _options.uri = _uri;
    _options.qs = params;

    return rp.get(_options).then((resp: any) => resp.data);
  }

  private async signed_post_request(
    path: string,
    payload: any = {},
    token: any = _.values(this.tokens)[0],
  ): Promise<any> {
    payload.token = token;

    const _uri = this.host + path;
    const _payload = JSON.stringify(payload);
    const _options = JSON.parse(JSON.stringify(this.options));

    _.extend(_options.headers, this.create_signed_headers(_uri, _payload));
    _options.uri = _uri;
    _options.body = payload;

    return rp.post(_options).then((resp: any) => resp.data);
  }

  private async unsigned_request(path: string, payload?: any): Promise<any> {
    const hasPayload = payload !== undefined;

    const _mixin: any = {
      method: hasPayload ? 'POST' : 'GET',
      uri: this.host + path,
      ...(hasPayload ? { body: payload } : undefined),
    };

    const _options = { ...JSON.parse(JSON.stringify(this.options)), ..._mixin };

    return rp(_options).then((resp: any) => resp.data);
  }
}
