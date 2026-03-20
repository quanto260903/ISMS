// ============================================================
//  features/export/hooks/useGoodsSearch.ts
//  Thay đổi: khi chọn hàng → không điền ngay vào table
//  mà trigger callback onGoodsSelected để parent mở modal
//  bắt buộc chọn chứng từ nhập trước
// ============================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchGoods } from "../export.api";
import type {
  GoodsSearchResult,
  DropdownState,
  DropdownPos,
  ExportItem,
} from "../types/export.types";

interface Props {
  updateItem:      (index: number, field: keyof ExportItem, value: unknown) => void;
  onSelectGoods:   (index: number, goods: GoodsSearchResult) => void;
  onAddItem:       () => void;
  // Callback mới: thay vì điền ngay, báo cho parent biết
  // user vừa chọn hàng nào ở dòng nào để mở modal
  onGoodsSelected: (index: number, goods: GoodsSearchResult, totalItems: number) => void;
}

export function useGoodsSearch({
  updateItem,
  onSelectGoods,
  onAddItem,
  onGoodsSelected,
}: Props) {
  const [dropdowns,   setDropdowns]   = useState<DropdownState[]>([]);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const dropdownRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const inputRefs      = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const addDropdown    = () =>
    setDropdowns((prev) => [...prev, { suggestions: [], loading: false, open: false }]);
  const removeDropdown = (index: number) =>
    setDropdowns((prev) => prev.filter((_, i) => i !== index));

  const openPortalDropdown = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4, left: rect.left,
      width: Math.max(rect.width, 480), index,
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      dropdownRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node))
          setDropdowns((prev) =>
            prev.map((d, idx) => idx === i ? { ...d, open: false } : d));
      });
      setDropdownPos((prev) => {
        if (!prev) return null;
        const inputEl = inputRefs.current[prev.index];
        return inputEl && !inputEl.contains(e.target as Node) ? null : prev;
      });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGoodsIdChange = useCallback(
    (index: number, value: string) => {
      updateItem(index, "goodsId", value);
      if (!value.trim()) {
        setDropdowns((prev) =>
          prev.map((d, i) =>
            i === index ? { suggestions: [], loading: false, open: false } : d));
        setDropdownPos(null);
        return;
      }
      setDropdowns((prev) =>
        prev.map((d, i) => i === index ? { ...d, loading: true, open: true } : d));
      openPortalDropdown(index);
      clearTimeout(debounceTimers.current[index]);
      debounceTimers.current[index] = setTimeout(async () => {
        try {
          const results = await searchGoods(value);
          setDropdowns((prev) =>
            prev.map((d, i) =>
              i === index ? { suggestions: results, loading: false, open: true } : d));
          openPortalDropdown(index);
        } catch {
          setDropdowns((prev) =>
            prev.map((d, i) =>
              i === index ? { suggestions: [], loading: false, open: false } : d));
          setDropdownPos(null);
        }
      }, 350);
    },
    [openPortalDropdown, updateItem]
  );

  // ── Điểm thay đổi chính ──────────────────────────────────
  // Thay vì gọi onSelectGoods ngay (điền hàng vào table),
  // gọi onGoodsSelected để parent mở modal chọn chứng từ nhập.
  // onSelectGoods chỉ được gọi SAU KHI user xác nhận trong modal.
  const handleSelectGoods = useCallback(
    (index: number, goods: GoodsSearchResult, totalItems: number) => {
      // Đóng dropdown trước
      setDropdowns((prev) =>
        prev.map((d, i) =>
          i === index ? { suggestions: [], loading: false, open: false } : d));
      setDropdownPos(null);

      // Báo cho parent mở modal bắt buộc chọn chứng từ nhập
      // Parent sẽ gọi onSelectGoods và addItem sau khi user xác nhận
      onGoodsSelected(index, goods, totalItems);
    },
    [onGoodsSelected]
  );

  const handleInputFocus = useCallback(
    (index: number, e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      const dd = dropdowns[index];
      if (dd?.suggestions.length > 0) {
        setDropdowns((prev) =>
          prev.map((d, i) => i === index ? { ...d, open: true } : d));
        openPortalDropdown(index);
      }
    },
    [dropdowns, openPortalDropdown]
  );

  return {
    dropdowns, dropdownPos,
    dropdownRefs, inputRefs,
    setDropdownPos,
    addDropdown, removeDropdown,
    handleGoodsIdChange,
    handleSelectGoods,
    handleInputFocus,
  };
}