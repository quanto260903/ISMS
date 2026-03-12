// ============================================================
//  shared/hooks/supplier/useSupplierSearch.ts
//  Pattern giống useGoodsSearch: hook quản lý state + refs
//  Form cha nhận refs và render portal dropdown
// ============================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchSuppliers } from "@/shared/api/supplier.api";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";

export interface SupplierDropdownState {
  suggestions: SupplierSearchResult[];
  loading:     boolean;
  open:        boolean;
}

export interface SupplierDropdownPos {
  top:   number;
  left:  number;
  width: number;
}

interface Props {
  onSelect: (supplier: SupplierSearchResult) => void;
}

export function useSupplierSearch({ onSelect }: Props) {
  const [dropdown,    setDropdown]    = useState<SupplierDropdownState>({
    suggestions: [], loading: false, open: false,
  });
  const [dropdownPos, setDropdownPos] = useState<SupplierDropdownPos | null>(null);

  const inputRef      = useRef<HTMLInputElement | null>(null);
  const dropdownRef   = useRef<HTMLDivElement | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Đóng dropdown khi click ra ngoài ───────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInput    = inputRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedInput && !clickedDropdown) {
        setDropdown((prev) => ({ ...prev, open: false }));
        setDropdownPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Tính vị trí portal dropdown từ input ───────────────
  const openPortalDropdown = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  rect.left   + window.scrollX,
      width: Math.max(rect.width, 360),
    });
  }, []);

  // ── Khi người dùng gõ ──────────────────────────────────
  const handleChange = useCallback((value: string) => {
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
        const results = await searchSuppliers(value.trim());
        setDropdown({ suggestions: results, loading: false, open: true });
        openPortalDropdown();
      } catch {
        setDropdown({ suggestions: [], loading: false, open: false });
        setDropdownPos(null);
      }
    }, 350);
  }, [openPortalDropdown]);

  // ── Khi focus lại ô input đã có kết quả ────────────────
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (dropdown.suggestions.length > 0) {
      setDropdown((prev) => ({ ...prev, open: true }));
      openPortalDropdown();
    }
  }, [dropdown.suggestions.length, openPortalDropdown]);

  // ── Khi chọn 1 NCC ─────────────────────────────────────
  const handleSelect = useCallback((supplier: SupplierSearchResult) => {
    onSelect(supplier);
    setDropdown({ suggestions: [], loading: false, open: false });
    setDropdownPos(null);
  }, [onSelect]);

  const closeDropdown = useCallback(() => {
    setDropdown((prev) => ({ ...prev, open: false }));
    setDropdownPos(null);
  }, []);

  return {
    dropdown, dropdownPos,
    inputRef, dropdownRef,
    setDropdownPos,
    handleChange, handleFocus, handleSelect, closeDropdown,
  };
}