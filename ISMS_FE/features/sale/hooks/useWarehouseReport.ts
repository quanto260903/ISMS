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

  // asOfDate: yyyy-MM-dd — chỉ tính phiếu xuất có ngày <= asOfDate.
  // Truyền ngày của phiếu xuất đang tạo/sửa để hiển thị tồn đúng thời điểm đó.
  const fetchReport = async (
    itemIndex: number, goodsId: string, goodsName: string,
    asOfDate?: string,
  ) => {
    if (!goodsId.trim()) return;

    setReport({ itemIndex, goodsId, goodsName, data: [], loading: true, error: "" });

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      const token    = typeof window !== "undefined"
        ? localStorage.getItem("token") : null;
      const q   = asOfDate ? `?asOfDate=${encodeURIComponent(asOfDate)}` : "";
      const res = await fetch(
        `${BASE_URL}/Items/warehouse-report/${encodeURIComponent(goodsId)}${q}`,
        {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
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