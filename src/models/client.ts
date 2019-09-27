export interface PairClientResponse {
  merchant: string;
}

export interface GetInvoicesArgs {
  status?: string;
  orderId?: string;
  itemCode?: string;
  dateStart?: string;
  dateEnd?: string;
  limit?: number;
  offset?: number;
}

export interface CreateInvoiceArgs {
  currency: string;
  price: number;
  orderId?: string | number;
  expirationTime?: string;
  itemDesc?: string;
  itemCode?: string;
  posData?: string;
  status?: string;
  redirectUrl?: string;
  transactionSpeed?: 'low' | 'low-medium' | 'medium' | 'high';
  physical?: boolean;
  supportedTransactionCurrencies?: {
    [index: string]: {
      enabled: boolean;
    };
  };
  refundable?: boolean;
  taxIncluded?: number;
  token?: string;
  redirectAutomatically?: boolean;
  notificationEmail?: string;
  notificationURL?: string;
  extendedNotifications?: boolean;
  fullNotifications?: boolean;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerCountry?: string;
  buyerZip?: string;
  buyerState?: string;
  buyerCity?: string;
  buyerAddress2?: string;
  buyerAddress1?: string;
  buyerName?: string;
}
