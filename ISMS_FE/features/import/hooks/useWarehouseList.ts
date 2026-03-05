// ============================================================
//  features/inward/hooks/useWarehouseList.ts
//  Load danh sách kho để hiển thị dropdown chọn kho nhập
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { getWarehouses } from "../import.api";

export interface WarehouseOption {
  warehouseId: string;
  warehouseName: string;
}

export function useWarehouseList() {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    setLoading(true);
    getWarehouses()
      .then(setWarehouses)
      .catch(() => setWarehouses([]))
      .finally(() => setLoading(false));
  }, []);

  return { warehouses, loading };
}