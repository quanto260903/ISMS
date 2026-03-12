// ============================================================
//  features/audit/types/audit.types.ts
// ============================================================

export type AuditType = "FULL" | "PARTIAL";

export interface AuditItem {
  goodsId:        string;
  goodsName:      string;
  unit:           string;
  stockQuantity:  number;
  actualQuantity: number;
  difference:     number;
  reason:         string;
  action:         string;
}

export interface AuditVoucher {
  voucherId:    string;
  warehouseId:  string;
  auditType:    AuditType;
  description:  string;
  auditDate:    string;
  createdBy:    string;
  items:        AuditItem[];
}

export interface AuditGoodsSearchResult {
  goodsId:    string;
  goodsName:  string;
  unit:       string;
  itemOnHand: number;
}

export interface DropdownState {
  suggestions: AuditGoodsSearchResult[];
  loading:     boolean;
  open:        boolean;
}

export interface DropdownPos {
  top:   number;
  left:  number;
  width: number;
  index: number;
}

// ── List types ───────────────────────────────────────────────
export interface AuditListDto {
  voucherId:    string;
  auditType:    string | null;
  description:  string | null;
  auditDate:    string | null;
  createdBy:    string | null;
  warehouseId:  string | null;
  itemCount:    number;
  matchCount:   number;
  surplusCount: number;
  deficitCount: number;
}

export interface AuditListResult {
  items:    AuditListDto[];
  total:    number;
  page:     number;
  pageSize: number;
}