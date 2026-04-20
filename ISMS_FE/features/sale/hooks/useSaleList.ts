"use client";

import { useState, useCallback, useEffect } from "react";
import { getSaleList } from "../sale.api";
import type { SaleListResult } from "../types/sale.types";

interface Filters {
  fromDate: string;
  toDate:   string;
  keyword:  string;
}

const today     = new Date();
const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
const todayStr  = today.toISOString().split("T")[0];

export function useSaleList() {
  const [filters, setFilters] = useState<Filters>({
    fromDate: thisMonth,
    toDate:   todayStr,
    keyword:  "",
  });
  const [page, setPage]       = useState(1);
  const PAGE_SIZE             = 50;
  const [result, setResult]   = useState<SaleListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getSaleList({
        fromDate: f.fromDate || undefined,
        toDate:   f.toDate   || undefined,
        keyword:  f.keyword  || undefined,
        page:     p,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters, page); }, [filters, page, load]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleSearch  = () => load(filters, 1);
  const handleRefresh = () => load(filters, page);

  return {
    filters, handleFilterChange, handleSearch, handleRefresh,
    page, setPage, PAGE_SIZE,
    result, loading, error,
  };
}
