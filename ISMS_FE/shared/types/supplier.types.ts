// ============================================================
//  shared/types/supplier.types.ts
// ============================================================

export interface SupplierSearchResult {
  supplierId:   string;
  supplierName: string;
  taxId?:       string;   // TaxId (không phải taxCode)
  address?:     string;
  phone?:       string;
}

export interface CreateSupplierRequest {
  supplierId:   string;
  supplierName: string;
  taxId?:       string;
  address?:     string;
  phone?:       string;
}