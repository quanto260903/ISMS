// ============================================================
//  features/sale/index.ts
//  Public API của feature sale
//  Bên ngoài chỉ import qua file này, không import thẳng vào file con
// ============================================================

// Components chính
export { default as AddSaleForm }    from "./components/AddSaleForm";
export { default as SaleListPage }   from "./components/SaleListPage";
export { default as SaleDetailPage } from "./components/SaleDetailPage";

// Hooks (nếu cần dùng ở nơi khác)
export { useSaleForm }        from "./hooks/useSaleForm";
export { useWarehouseReport } from "./hooks/useWarehouseReport";

// Types
export type {
  PaymentOption,
  Voucher,
  VoucherItem,
  GoodsSearchResult,
  WarehouseTransactionDto,
} from "./types/sale.types";