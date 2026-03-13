// ============================================================
//  features/suppliers/types/supplier.types.ts
// ============================================================

export interface SupplierListDto {
  supplierId:   string;
  supplierName: string | null;
  phone:        string | null;
  taxId:        string | null;
  address:      string | null;
  isEnterprise: boolean;
  isInactive:   boolean;
}

export interface SupplierDetailDto extends SupplierListDto {}

export interface CreateSupplierRequest {
  supplierId:   string;
  supplierName: string;
  phone?:       string;
  taxId?:       string;
  address?:     string;
  isEnterprise: boolean;
}

export interface UpdateSupplierRequest {
  supplierName: string;
  phone?:       string;
  taxId?:       string;
  address?:     string;
  isEnterprise: boolean;
}

export interface SupplierListResult {
  items:    SupplierListDto[];
  total:    number;
  page:     number;
  pageSize: number;
}