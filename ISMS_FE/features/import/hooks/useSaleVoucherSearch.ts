// ============================================================
//  features/import/hooks/useSaleVoucherSearch.ts
//  Typeahead dropdown tìm kiếm phiếu bán hàng gốc
//  Dùng khi lý do nhập = SALES_RETURN (Hàng bán bị trả lại)
// ============================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchSaleVouchers, getSaleVoucher, checkSaleUsedForReturn } from "../import.api";
import type { SaleSearchResult, SaleVoucherLookup } from "../types/import.types";

export interface SaleDropdownState {
  suggestions: SaleSearchResult[];
  loading:     boolean;
  open:        boolean;
}

export interface SaleDropdownPos {
  top:   number;
  left:  number;
  width: number;
}

interface Props {
  onSelect: (voucher: SaleVoucherLookup) => void;
}

export function useSaleVoucherSearch({ onSelect }: Props) {
  const [query,        setQuery]        = useState("");
  const [dropdown,     setDropdown]     = useState<SaleDropdownState>({
    suggestions: [], loading: false, open: false,
  });
  const [dropdownPos,  setDropdownPos]  = useState<SaleDropdownPos | null>(null);
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

  // Tính vị trí portal (viewport-relative cho position:fixed)
  const openPortalDropdown = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + 4,
      left:  rect.left,
      width: Math.max(rect.width, 420),
    });
  }, []);

  // Cập nhật vị trí khi scroll hoặc resize
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
        const results = await searchSaleVouchers(value.trim());
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

  const handleSelect = useCallback(async (result: SaleSearchResult) => {
    setDropdown({ suggestions: [], loading: false, open: false });
    setDropdownPos(null);
    setQuery(result.voucherId);
    setFetchLoading(true);
    setError("");
    try {
      const isUsed = await checkSaleUsedForReturn(result.voucherId);
      if (isUsed) {
        setError("Đã nhập kho cho phiếu bán hàng này rồi");
        return;
      }
      const voucher = await getSaleVoucher(result.voucherId);
      if (!voucher) {
        setError(`Không tìm thấy phiếu bán: ${result.voucherId}`);
        return;
      }
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
