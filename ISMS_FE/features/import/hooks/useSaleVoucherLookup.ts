// ============================================================
//  features/inward/hooks/useSaleVoucherLookup.ts
//  Tra cứu phiếu bán hàng theo số hóa đơn → auto-fill bảng nhập kho
// ============================================================

"use client";

import { useState } from "react";
import { getSaleVoucher } from "../import.api";
import type { SaleVoucherLookup } from "../types/import.types";

export function useSaleVoucherLookup() {
  const [saleVoucherId, setSaleVoucherId]   = useState("");
  const [lookupResult, setLookupResult]     = useState<SaleVoucherLookup | null>(null);
  const [lookupLoading, setLookupLoading]   = useState(false);
  const [lookupError, setLookupError]       = useState("");

  const handleLookup = async () => {
    if (!saleVoucherId.trim()) {
      setLookupError("Vui lòng nhập số hóa đơn bán hàng");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);

    try {
      const result = await getSaleVoucher(saleVoucherId.trim());
      if (!result) {
        setLookupError(`Không tìm thấy phiếu bán: ${saleVoucherId}`);
      } else {
        setLookupResult(result);
      }
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : "Lỗi tra cứu");
    } finally {
      setLookupLoading(false);
    }
  };

  const clearLookup = () => {
    setSaleVoucherId("");
    setLookupResult(null);
    setLookupError("");
  };

  return {
    saleVoucherId, setSaleVoucherId,
    lookupResult,
    lookupLoading,
    lookupError,
    handleLookup,
    clearLookup,
  };
}