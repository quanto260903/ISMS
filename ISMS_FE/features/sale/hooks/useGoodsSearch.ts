// ============================================================
//  features/sale/hooks/useGoodsSearch.ts
//  Quản lý tìm kiếm hàng hóa, dropdown gợi ý, portal position
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { searchGoods } from "@/services/api/sale.api";
import type {
  GoodsSearchResult,
  DropdownState,
  DropdownPos,
  VoucherItem,
} from "../types/sale.types";

interface UseGoodsSearchProps {
  itemCount: number;
  updateItem: (index: number, field: keyof VoucherItem, value: unknown) => void;
  onSelectGoods: (index: number, goods: GoodsSearchResult) => void;
  onAddItem: () => void; // callback để tự động thêm dòng mới
}

export function useGoodsSearch({ itemCount, updateItem, onSelectGoods, onAddItem }: UseGoodsSearchProps) {
  const [dropdowns, setDropdowns] = useState<DropdownState[]>([]);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);

  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRefs    = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Sync mảng dropdowns theo số lượng items
  const addDropdown = () =>
    setDropdowns((prev) => [...prev, { suggestions: [], loading: false, open: false }]);

  const removeDropdown = (index: number) =>
    setDropdowns((prev) => prev.filter((_, i) => i !== index));

  // Tính vị trí fixed cho portal dropdown
  const openPortalDropdown = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + 4,
      left:  rect.left,
      width: Math.max(rect.width, 500),
      index,
    });
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      dropdownRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node)) {
          setDropdowns((prev) =>
            prev.map((d, idx) => (idx === i ? { ...d, open: false } : d))
          );
        }
      });
      setDropdownPos((prev) => {
        if (!prev) return null;
        const inputEl = inputRefs.current[prev.index];
        if (inputEl && !inputEl.contains(e.target as Node)) return null;
        return prev;
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoodsIdChange = useCallback(
    (index: number, value: string, totalItems: number) => {
      updateItem(index, "goodsId", value);

      if (!value.trim()) {
        setDropdowns((prev) =>
          prev.map((d, i) =>
            i === index ? { suggestions: [], loading: false, open: false } : d
          )
        );
        setDropdownPos(null);
        return;
      }

      setDropdowns((prev) =>
        prev.map((d, i) => (i === index ? { ...d, loading: true, open: true } : d))
      );
      openPortalDropdown(index);

      clearTimeout(debounceTimers.current[index]);
      debounceTimers.current[index] = setTimeout(async () => {
        try {
          const results = await searchGoods(value);
          setDropdowns((prev) =>
            prev.map((d, i) =>
              i === index ? { suggestions: results, loading: false, open: true } : d
            )
          );
          openPortalDropdown(index);
        } catch {
          setDropdowns((prev) =>
            prev.map((d, i) =>
              i === index ? { suggestions: [], loading: false, open: false } : d
            )
          );
          setDropdownPos(null);
        }
      }, 350);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openPortalDropdown, updateItem]
  );

  const handleSelectGoods = useCallback(
    (index: number, goods: GoodsSearchResult, totalItems: number) => {
      onSelectGoods(index, goods);
      setDropdowns((prev) =>
        prev.map((d, i) =>
          i === index ? { suggestions: [], loading: false, open: false } : d
        )
      );
      setDropdownPos(null);

      // Thêm dòng mới khi người dùng chọn hàng ở dòng cuối
      if (index === totalItems - 1) {
        onAddItem();
      }
    },
    [onSelectGoods, onAddItem]
  );

  const handleInputFocus = useCallback(
    (index: number, e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      const dd = dropdowns[index];
      if (dd?.suggestions.length > 0) {
        setDropdowns((prev) =>
          prev.map((d, i) => (i === index ? { ...d, open: true } : d))
        );
        openPortalDropdown(index);
      }
    },
    [dropdowns, openPortalDropdown]
  );

  return {
    dropdowns,
    dropdownPos,
    dropdownRefs,
    inputRefs,
    setDropdownPos,
    addDropdown,
    removeDropdown,
    handleGoodsIdChange,
    handleSelectGoods,
    handleInputFocus,
  };
}