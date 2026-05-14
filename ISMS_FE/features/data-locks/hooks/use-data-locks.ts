"use client";

import { useCallback, useEffect, useState } from "react";
import type { DataLock, LockModule } from "../types/data-lock";
import * as api from "../data-lock.api";

export interface LockState {
  module: LockModule;
  isLocked: boolean;
  lock: DataLock | null;
  loading: boolean;
}

export function useDataLocks() {
  const [states, setStates] = useState<LockState[]>([
    { module: "INVENTORY", isLocked: false, lock: null, loading: true },
    { module: "CASH",      isLocked: false, lock: null, loading: true },
    { module: "BANK",      isLocked: false, lock: null, loading: true },
    { module: "CUSTOMER",  isLocked: false, lock: null, loading: true },
  ]);

  const [actionLoading, setActionLoading] = useState<LockModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setStates((prev) => prev.map((s) => ({ ...s, loading: true })));
    try {
      const all = await api.getAllLocks();
      setStates((prev) =>
        prev.map((s) => ({
          ...s,
          isLocked: all[s.module].isLocked,
          lock: all[s.module].data,
          loading: false,
        }))
      );
    } catch (e) {
      setError((e as Error).message);
      setStates((prev) => prev.map((s) => ({ ...s, loading: false })));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const lock = async (
    module: LockModule,
    lockedUntilDate: string,
    reason?: string
  ) => {
    setActionLoading(module);
    setError(null);
    try {
      const result = await api.lockData(module, { lockedUntilDate, reason });
      setStates((prev) =>
        prev.map((s) =>
          s.module === module
            ? { ...s, isLocked: true, lock: result }
            : s
        )
      );
      showToast(`Đã khóa module thành công!`);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const unlock = async (module: LockModule) => {
    setActionLoading(module);
    setError(null);
    try {
      const result = await api.unlockData(module);
      setStates((prev) =>
        prev.map((s) =>
          s.module === module
            ? { ...s, isLocked: false, lock: result }
            : s
        )
      );
      showToast(`Đã mở khóa module thành công!`);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const refresh = (module: LockModule) => {
    setStates((prev) =>
      prev.map((s) => (s.module === module ? { ...s, loading: true } : s))
    );
    api.getCurrentLock(module).then((res) => {
      setStates((prev) =>
        prev.map((s) =>
          s.module === module
            ? { ...s, isLocked: res.isLocked, lock: res.data, loading: false }
            : s
        )
      );
    });
  };

  return { states, actionLoading, error, toast, lock, unlock, refresh, fetchAll };
}
