// ============================================================
//  features/sale/index.ts
//  Public API của feature sale
//  Bên ngoài chỉ import qua file này, không import thẳng vào file con
// ============================================================

// Component chính
export { default as AddSaleForm } from "./components/AddSaleForm";

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