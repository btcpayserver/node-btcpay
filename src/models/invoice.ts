export interface Invoice {
  id: string;
  token: string;
  price: number;
  currency: string;
  orderId: string;
  orderID?: string;
  itemDesc: string;
  itemCode: string;
  notificationEmail: string;
  notificationURL: string;
  redirectURL: string;
  paymentUrls?: any;
  paymentCodes: any;
  posData: string;
  transactionSpeed: string;
  fullNotifications: boolean;
  extendedNotifications: boolean;
  physical: boolean;
  buyer: {
    name: string;
    address1: string;
    address2: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
    email: string;
    phone: string;
    notify: boolean;
  };
  url: string;
  status: string;
  btcPaid?: number;
  amountPaid: number;
  btcPrice?: number;
  paymentSubtotals: any;
  btcDue?: number;
  paymentTotals: any;
  minerFees: any;
  invoiceTime: number;
  expirationTime: number;
  currentTime: string; // 'date' === string?
  exceptionStatus: string | boolean;
  rate?: number;
  exRates?: any;
  exchangeRates: any;
  transactions: Array<{
    amount: number;
    confirmations: number;
    time: string; // 'date' === string?
    receivedTime: string; // 'date' === string?
  }>;
  flags?: {
    refundable: string;
  };
  creditedOverpaymentAmounts: any;
  refundInfo: Array<{
    supportRequest: string;
    currency: string;
    amounts: any;
  }>;
  transactionCurrency: string;
  supportedTransactionCurrencies: any;
  buyerProvidedInfo: {
    selectedTransactionCurrency: any;
  };
}
