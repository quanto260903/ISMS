// ============================================================
//  features/inward/index.ts
//  Public API — bên ngoài chỉ import qua file này
// ============================================================

export { default as AddInwardForm } from "./components/AddInwardForm";
export { useInwardForm }            from "./hooks/useInwardForm";
export { useWarehouseList }         from "./hooks/useWarehouseList";
export { default as SupplierSearchInput } from "../../shared/components/supplier/SupplierSearchInput";
export { default as CreateSupplierModal } from "../../shared/components/supplier/CreateSupplierModal";
export type {
  PaymentOption,
  InwardVoucher,
  InwardItem,
  GoodsSearchResult,
} from "./types/import.types";