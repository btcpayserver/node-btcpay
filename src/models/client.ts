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
