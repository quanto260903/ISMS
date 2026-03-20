"use client";

import { useState, useEffect } from "react";
import { getExport } from "../export.api";
import type { ExportVoucher } from "../types/export.types";

export function useExportDetail(voucherId: string) {
  const [data,    setData]    = useState<ExportVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!voucherId) return;
    setLoading(true);
    setError("");

    getExport(voucherId)
      .then((voucher) => {
        const items = voucher.items.length > 0
          ? [...voucher.items, createEmptyRow(voucher)]
          : [createEmptyRow(voucher)];
        setData({ ...voucher, items });
      })
      .catch((err) => setError(err.message ?? "Không thể tải phiếu xuất"))
      .finally(() => setLoading(false));
  }, [voucherId]);

  return { data, loading, error };
}

function createEmptyRow(voucher: ExportVoucher) {
  const last = voucher.items[voucher.items.length - 1];
  return {
    goodsId:           "",
    goodsName:         "",
    unit:              "",
    quantity:          1,
    unitPrice:         0,
    amount1:           0,
    vat:               0,
    promotion:         0,
    debitAccount1:     last?.debitAccount1 ?? "632",
    creditAccount1:    last?.creditAccount1 ?? "156",
    debitAccount2:     last?.debitAccount2  ?? "",
    creditAccount2:    last?.creditAccount2 ?? "",
    costPerUnit:       0,
    userId:            last?.userId ?? "",
    createdDateTime:   new Date().toISOString(),
    offsetVoucher:     "",
  };
}