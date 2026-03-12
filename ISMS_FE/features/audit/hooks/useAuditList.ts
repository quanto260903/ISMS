// ============================================================
//  features/audit/hooks/useAuditList.ts
// ============================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import { getAuditList } from "../audit.api";
import type { AuditListDto, AuditListResult } from "../types/audit.types";

interface Filters {
  fromDate:    string;
  toDate:      string;
  keyword:     string;
  warehouseId: string;
}

const today     = new Date();
const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
const todayStr  = today.toISOString().split("T")[0];

export function useAuditList() {
  const [filters, setFilters] = useState<Filters>({
    fromDate:    thisMonth,
    toDate:      todayStr,
    keyword:     "",
    warehouseId: "",
  });
  const [page, setPage]       = useState(1);
  const PAGE_SIZE              = 50;
  const [result, setResult]   = useState<AuditListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const fetchData = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditList({
        fromDate:    f.fromDate    || undefined,
        toDate:      f.toDate      || undefined,
        keyword:     f.keyword     || undefined,
        warehouseId: f.warehouseId || undefined,
        page:        p,
        pageSize:    PAGE_SIZE,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(filters, page); }, [filters, page, fetchData]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleSearch  = () => fetchData(filters, 1);
  const handleRefresh = () => fetchData(filters, page);

  return {
    filters, handleFilterChange, handleSearch, handleRefresh,
    page, setPage, PAGE_SIZE,
    result, loading, error,
  };
}