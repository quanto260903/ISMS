"use client";

import { useState, useEffect } from "react";
import { getWarehouses } from "../export.api";

export interface WarehouseOption {
  warehouseId:   string;
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