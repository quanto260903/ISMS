// ============================================================
//  features/export/hooks/useInwardVoucherLookup.ts
//  Tra cứu phiếu nhập kho theo số phiếu → auto-fill bảng xuất kho
//  Dùng khi lý do xuất = IMPORT_RETURN (Hàng nhập bị trả lại)
// ============================================================

"use client";

import { useState } from "react";
import { getInward } from "@/features/import/import.api";
import type { InwardVoucher } from "@/features/import/types/import.types";

export function useInwardVoucherLookup() {
  const [inwardVoucherId, setInwardVoucherId] = useState("");
  const [lookupResult,    setLookupResult]    = useState<InwardVoucher | null>(null);
  const [lookupLoading,   setLookupLoading]   = useState(false);
  const [lookupError,     setLookupError]     = useState("");

  const handleLookup = async () => {
    if (!inwardVoucherId.trim()) {
      setLookupError("Vui lòng nhập số phiếu nhập kho");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);

    try {
      const result = await getInward(inwardVoucherId.trim());
      setLookupResult(result);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : "Lỗi tra cứu phiếu nhập");
    } finally {
      setLookupLoading(false);
    }
  };

  const clearLookup = () => {
    setInwardVoucherId("");
    setLookupResult(null);
    setLookupError("");
  };

  return {
    inwardVoucherId, setInwardVoucherId,
    lookupResult,
    lookupLoading,
    lookupError,
    handleLookup,
    clearLookup,
  };
}
