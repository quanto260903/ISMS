"use client";

import { useState, useEffect } from "react";
import { baseApi } from "@/services/baseApi";
import type { SaleVoucherDetail } from "../types/sale.types";

export function useSaleDetail(voucherId: string) {
  const [data,    setData]    = useState<SaleVoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!voucherId) return;
    setLoading(true);
    setError("");

    baseApi
      .get<{ data: SaleVoucherDetail }>(`/SaleGoods/voucher/${encodeURIComponent(voucherId)}`)
      .then((res) => setData(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Không thể tải phiếu bán")
      )
      .finally(() => setLoading(false));
  }, [voucherId]);

  return { data, loading, error };
}
