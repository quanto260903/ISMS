export type LockModule = "INVENTORY" | "CASH" | "BANK" | "CUSTOMER";

export interface DataLock {
  dataLockId: number;
  module: LockModule;
  lockedUntilDate: string; // "YYYY-MM-DD"
  isActive: boolean;
  reason: string | null;
  lockedByUserId: string;
  lockedAt: string; // ISO datetime
  unlockedByUserId: string | null;
  unlockedAt: string | null;
}

export interface GetCurrentLockResponse {
  isLocked: boolean;
  data: DataLock | null;
}

export interface LockDataRequest {
  lockedUntilDate: string;
  reason?: string;
}

export const MODULE_META: Record<
  LockModule,
  { label: string; icon: string; color: string }
> = {
  INVENTORY: { label: "Kho hàng",   icon: "📦", color: "#0ea5e9" },
  CASH:      { label: "Tiền mặt",   icon: "💵", color: "#10b981" },
  BANK:      { label: "Ngân hàng",  icon: "🏦", color: "#8b5cf6" },
  CUSTOMER:  { label: "Khách hàng", icon: "👥", color: "#f59e0b" },
};
