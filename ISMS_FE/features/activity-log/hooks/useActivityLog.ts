"use client";

import { useState, useCallback, useEffect } from "react";
import { getActivityLogs } from "../activityLog.api";
import type { ActivityLogResult } from "../types/activityLog.types";

interface Filters {
  module:   string;
  fromDate: string;
  toDate:   string;
  keyword:  string;
}

const today     = new Date();
const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
const todayStr  = today.toISOString().split("T")[0];

export function useActivityLog() {
  const [filters, setFilters] = useState<Filters>({
    module:   "",
    fromDate: thisMonth,
    toDate:   todayStr,
    keyword:  "",
  });
  const [page, setPage]       = useState(1);
  const PAGE_SIZE             = 50;
  const [result, setResult]   = useState<ActivityLogResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getActivityLogs({
        module:   f.module   || undefined,
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

  const handleRefresh = () => load(filters, page);

  return {
    filters, handleFilterChange, handleRefresh,
    page, setPage, PAGE_SIZE,
    result, loading, error,
  };
}
