// ============================================================
//  features/sale/hooks/useWarehouseReport.ts
//  Fetch và quản lý state báo cáo xuất nhập kho
//  itemIndex: dòng sản phẩm nào đang xem kho → dùng để điền ngược creditWarehouseId
// ============================================================
'use client';
import { useState } from "react";
import type { WarehouseReportState } from "../types/sale.types";

export function useWarehouseReport() {
  const [report, setReport] = useState<WarehouseReportState | null>(null);

  // itemIndex: index dòng trong bảng sản phẩm đã bấm nút "Kho"
  const fetchReport = async (itemIndex: number, goodsId: string, goodsName: string) => {
    if (!goodsId.trim()) return;

    setReport({ itemIndex, goodsId, goodsName, data: [], loading: true, error: "" });

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${BASE_URL}/Items/warehouse-report/${encodeURIComponent(goodsId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Lỗi ${res.status}: ${res.statusText}`);

      const json = await res.json();
      const rows = Array.isArray(json) ? json : json.data ?? [];

      setReport({ itemIndex, goodsId, goodsName, data: rows, loading: false, error: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setReport((prev) =>
        prev ? { ...prev, loading: false, error: message } : null
      );
    }
  };

  const closeReport = () => setReport(null);

  return { report, fetchReport, closeReport };
}