// ============================================================
//  features/inward/hooks/useInwardDetail.ts
//  Fetch 1 phiếu nhập kho theo ID — dùng cho trang edit
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { getInward } from "../import.api";
import type { InwardVoucher } from "../types/import.types";

export function useInwardDetail(voucherId: string) {
  const [data,    setData]    = useState<InwardVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!voucherId) return;
    setLoading(true);
    setError("");

    getInward(voucherId)
      .then((voucher) => {
        // Đảm bảo luôn có ít nhất 1 dòng trống ở cuối để giữ pattern auto-add
        const items = voucher.items.length > 0
          ? [...voucher.items, createEmptyRow(voucher)]
          : [createEmptyRow(voucher)];
        setData({ ...voucher, items });
      })
      .catch((err) => setError(err.message ?? "Không thể tải phiếu nhập"))
      .finally(() => setLoading(false));
  }, [voucherId]);

  return { data, loading, error };
}

// Tạo dòng trống kế thừa account từ dòng cuối cùng
function createEmptyRow(voucher: InwardVoucher) {
  const last = voucher.items[voucher.items.length - 1];
  return {
    goodsId:          "",
    goodsName:        "",
    unit:             "",
    quantity:         1,
    unitPrice:        0,
    amount1:          0,
    vat:              10,
    promotion:        0,
    debitAccount1:    last?.debitAccount1  ?? "156",
    creditAccount1:   last?.creditAccount1 ?? "331",
    debitWarehouseId: "",
    debitAccount2:    last?.debitAccount2  ?? "1331",
    creditAccount2:   last?.creditAccount2 ?? "331",
    userId:           last?.userId         ?? "",
    createdDateTime:  new Date().toISOString(),
  };
}