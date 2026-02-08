// Return Order Types

export interface ReturnReason {
  reasonId: number;
  reasonCode: string;
  description: string;
}

export interface ReturnStatus {
  status: string;
  count: number;
}

export interface ReturnOrderItem {
  returnDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  reasonId: number;
  reasonCode: string;
  note?: string;
  actionId?: number;
  locationId?: number;
}

export interface ReturnOrder {
  returnOrderId: number;
  exportOrderId: number;
  checkInTime: string;
  status: string;
  note?: string;
  checkedByName?: string;
  reviewedByName?: string;
}

export interface ReturnOrderListItem {
  returnOrderId: number;
  exportOrderId: number;
  checkInTime: string;
  status: string;
  note?: string;
  checkedByName?: string;
  reviewedByName?: string;
}

export interface ReturnOrderDetail {
  header: ReturnOrder;
  lines: ReturnOrderItem[];
}

export interface CreateReturnOrderRequest {
  returnNumber: string;
  returnDate: string;
  customerId?: number;
  exportOrderId?: number;
  statusId: number;
  items: {
    productId: number;
    quantity: number;
    reasonId: number;
  }[];
}

export interface ReturnOrderQueryParams {
  q?: string;
  from?: string;
  to?: string;
  status?: string;
  exportOrderId?: number;
  checkedBy?: number;
  reviewedBy?: number;
  page?: number;
  pageSize?: number;
}

export interface ReturnReasonQueryParams {
  q?: string;
}

export interface ReturnStatusQueryParams {
  q?: string;
}
