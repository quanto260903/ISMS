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
  // Optional: nếu có → mở modal bắt buộc chọn chứng từ nhập trước khi điền
  // Nếu không có → điền hàng trực tiếp vào table (dùng cho EditExportForm khi không có modal)
  onGoodsSelected?: (index: number, goods: GoodsSearchResult, totalItems: number) => void;
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

  // Khi user chọn hàng từ dropdown:
  // - Nếu onGoodsSelected được truyền → báo cho parent mở modal bắt buộc chọn chứng từ nhập
  // - Nếu không → điền hàng trực tiếp vào table (hành vi cũ, dùng khi không có modal)
  const handleSelectGoods = useCallback(
    (index: number, goods: GoodsSearchResult, totalItems: number) => {
      setDropdowns((prev) =>
        prev.map((d, i) =>
          i === index ? { suggestions: [], loading: false, open: false } : d));
      setDropdownPos(null);

      if (onGoodsSelected) {
        onGoodsSelected(index, goods, totalItems);
      } else {
        onSelectGoods(index, goods);
        if (index === totalItems - 1) onAddItem();
      }
    },
    [onGoodsSelected, onSelectGoods, onAddItem]
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