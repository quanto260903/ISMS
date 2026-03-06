// ============================================================
//  features/inward/hooks/useInwardList.ts
// ============================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import { getInwardList } from "../import.api";
import type { InwardListResult } from "../types/import.types";

interface Filters {
  fromDate: string;
  toDate:   string;
  keyword:  string;
}

const today     = new Date();
const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
const todayStr  = today.toISOString().split("T")[0];

export function useInwardList() {
  const [filters, setFilters] = useState<Filters>({
    fromDate: thisMonth,
    toDate:   todayStr,
    keyword:  "",
  });
  const [page, setPage]           = useState(1);
  const PAGE_SIZE                 = 50;
  const [result, setResult]       = useState<InwardListResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const fetch = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getInwardList({
        fromDate:  f.fromDate || undefined,
        toDate:    f.toDate   || undefined,
        keyword:   f.keyword  || undefined,
        page:      p,
        pageSize:  PAGE_SIZE,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải lại khi filter/page thay đổi
  useEffect(() => { fetch(filters, page); }, [filters, page, fetch]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleSearch = () => fetch(filters, 1);
  const handleRefresh = () => fetch(filters, page);

  return {
    filters, handleFilterChange, handleSearch, handleRefresh,
    page, setPage,
    PAGE_SIZE,
    result, loading, error,
  };
}