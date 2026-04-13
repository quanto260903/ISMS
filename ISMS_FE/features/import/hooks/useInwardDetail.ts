"use client";

import { useEffect, useState } from "react";
import { getInward } from "../import.api";
import type { InwardItem, InwardVoucher } from "../types/import.types";
import {
  DEFAULT_CREDIT_ACCOUNT,
  QUARANTINE_BUCKET,
  SELLABLE_BUCKET,
} from "../constants/import.constants";

export function useInwardDetail(voucherId: string) {
  const [data, setData] = useState<InwardVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!voucherId) return;

    setLoading(true);
    setError("");

    getInward(voucherId)
      .then((voucher) => {
        const shouldAppendEmptyRow = voucher.voucherCode === "NK1";
        const items = voucher.items.length > 0
          ? shouldAppendEmptyRow
            ? [...voucher.items, createEmptyRow(voucher)]
            : voucher.items
          : shouldAppendEmptyRow
            ? [createEmptyRow(voucher)]
            : [];

        setData({ ...voucher, items });
      })
      .catch((err) => setError(err.message ?? "Khong the tai phieu nhap"))
      .finally(() => setLoading(false));
  }, [voucherId]);

  return { data, loading, error };
}

function createEmptyRow(voucher: InwardVoucher): InwardItem {
  const last = voucher.items[voucher.items.length - 1];
  return {
    goodsId: "",
    goodsName: "",
    unit: "",
    quantity: 1,
    unitPrice: 0,
    amount1: 0,
    promotion: 0,
    debitAccount1: last?.debitAccount1 ?? "156",
    creditAccount1: last?.creditAccount1 ?? DEFAULT_CREDIT_ACCOUNT,
    debitAccount2: last?.debitAccount2 ?? "1331",
    creditAccount2: last?.creditAccount2 ?? DEFAULT_CREDIT_ACCOUNT,
    stockBucket: voucher.voucherCode === "NK2" ? QUARANTINE_BUCKET : SELLABLE_BUCKET,
    userId: last?.userId ?? "",
    createdDateTime: new Date().toISOString(),
  };
}
