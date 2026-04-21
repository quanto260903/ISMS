// ============================================================
//  features/export/hooks/useInwardVoucherSearch.ts
//  Typeahead dropdown tìm kiếm phiếu nhập kho gốc
//  Dùng khi lý do xuất = DESTROY (Xuất hủy hàng)
// ============================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchInwardVouchers, getInward, checkInwardUsedForReturn } from "@/features/import/import.api";
import type { InwardSearchResult, InwardVoucher } from "@/features/import/types/import.types";

export interface InwardDropdownState {
  suggestions: InwardSearchResult[];
  loading:     boolean;
  open:        boolean;
}

export interface InwardDropdownPos {
  top:   number;
  left:  number;
  width: number;
}

interface Props {
  onSelect: (voucher: InwardVoucher) => void;
}

export function useInwardVoucherSearch({ onSelect }: Props) {
  const [query,       setQuery]       = useState("");
  const [dropdown,    setDropdown]    = useState<InwardDropdownState>({
    suggestions: [], loading: false, open: false,
  });
  const [dropdownPos, setDropdownPos] = useState<InwardDropdownPos | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error,        setError]        = useState("");

  const inputRef      = useRef<HTMLInputElement | null>(null);
  const dropdownRef   = useRef<HTMLDivElement | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setDropdown((prev) => ({ ...prev, open: false }));
        setDropdownPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openPortalDropdown = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // position:fixed dùng tọa độ viewport — không cộng scrollY/scrollX
    setDropdownPos({
      top:   rect.bottom + 4,
      left:  rect.left,
      width: Math.max(rect.width, 400),
    });
  }, []);

  // Cập nhật vị trí khi user scroll hoặc resize trong khi dropdown đang mở
  useEffect(() => {
    if (!dropdown.open) return;
    const update = () => openPortalDropdown();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [dropdown.open, openPortalDropdown]);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    setError("");

    if (!value.trim()) {
      setDropdown({ suggestions: [], loading: false, open: false });
      setDropdownPos(null);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    setDropdown((prev) => ({ ...prev, loading: true, open: true }));
    openPortalDropdown();

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchInwardVouchers(value.trim());
        setDropdown({ suggestions: results, loading: false, open: true });
        openPortalDropdown();
      } catch {
        setDropdown({ suggestions: [], loading: false, open: false });
        setDropdownPos(null);
      }
    }, 350);
  }, [openPortalDropdown]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (dropdown.suggestions.length > 0) {
      setDropdown((prev) => ({ ...prev, open: true }));
      openPortalDropdown();
    }
  }, [dropdown.suggestions.length, openPortalDropdown]);

  const handleSelect = useCallback(async (result: InwardSearchResult) => {
    setDropdown({ suggestions: [], loading: false, open: false });
    setDropdownPos(null);
    setQuery(result.voucherId);
    setFetchLoading(true);
    setError("");
    try {
      const isUsed = await checkInwardUsedForReturn(result.voucherId);
      if (isUsed) {
        setError("Đã xuất kho cho phiếu nhập này");
        return;
      }
      const voucher = await getInward(result.voucherId);
      onSelect(voucher);
    } catch {
      setError(`Không thể tải chi tiết phiếu ${result.voucherId}`);
    } finally {
      setFetchLoading(false);
    }
  }, [onSelect]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setError("");
    setDropdown({ suggestions: [], loading: false, open: false });
    setDropdownPos(null);
  }, []);

  return {
    query, dropdown, dropdownPos, fetchLoading, error,
    inputRef, dropdownRef,
    handleChange, handleFocus, handleSelect, clearSearch,
  };
}
