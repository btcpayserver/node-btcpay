import * as elliptic from 'elliptic';
import { Invoice } from '../models/invoice';
import { Rate } from '../models/rate';
export declare class BTCPayClient {
    private host;
    private kp;
    private tokens;
    private client_id;
    private user_agent;
    private options;
    constructor(host: string, keypair: elliptic.ec.KeyPair, tokens: any);
    pair_client(code: any): Promise<{}>;
    get_rates(currencyPairs: any, storeID: any): Promise<Rate[]>;
    create_invoice(payload: any, token?: any): Promise<Invoice>;
    get_invoice(invoice_id: string, token?: any): Promise<Invoice[]>;
    get_invoices(params: any, token?: any): Promise<Invoice[]>;
    private create_signed_headers;
    private signed_get_request;
    private signed_post_request;
    private unsigned_request;
}
