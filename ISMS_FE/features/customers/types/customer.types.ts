// ============================================================
//  features/customers/types/customer.types.ts
// ============================================================

export interface CustomerListDto {
  customerId:   string;
  customerName: string | null;
  phone:        string | null;
  taxId:        string | null;
  address:      string | null;
  isEnterprise: boolean;
  isInactive:   boolean;
}

export interface CustomerDetailDto extends CustomerListDto {}

export interface CustomerSearchResult {
  customerId:   string;
  customerName: string | null;
  phone:        string | null;
  taxId:        string | null;
}

export interface CreateCustomerRequest {
  customerId:   string;
  customerName: string;
  phone?:       string;
  taxId?:       string;
  address?:     string;
  isEnterprise: boolean;
}

export interface UpdateCustomerRequest {
  customerName: string;
  phone?:       string;
  taxId?:       string;
  address?:     string;
  isEnterprise: boolean;
}

export interface CustomerListResult {
  items:    CustomerListDto[];
  total:    number;
  page:     number;
  pageSize: number;
}