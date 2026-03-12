// ============================================================
//  features/audit/hooks/useAuditGoodsSearch.ts
//  Pattern giống useGoodsSearch: portal dropdown, debounce
// ============================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchGoods } from "../audit.api";
import type {
  AuditGoodsSearchResult,
  AuditItem,
  DropdownState,
  DropdownPos,
} from "../types/audit.types";

interface Props {
  updateItem:    (index: number, field: keyof AuditItem, value: unknown) => void;
  onSelectGoods: (index: number, goods: AuditGoodsSearchResult) => void;
  onAddItem:     () => void;
}

export function useAuditGoodsSearch({ updateItem, onSelectGoods, onAddItem }: Props) {
  const [dropdowns,    setDropdowns]    = useState<DropdownState[]>([]);
  const [dropdownPos,  setDropdownPos]  = useState<DropdownPos | null>(null);

  const dropdownRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const inputRefs      = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const addDropdown = () =>
    setDropdowns((prev) => [...prev, { suggestions: [], loading: false, open: false }]);

  const removeDropdown = (index: number) =>
    setDropdowns((prev) => prev.filter((_, i) => i !== index));

  const openPortalDropdown = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + 4,
      left:  rect.left,
      width: Math.max(rect.width, 440),
      index,
    });
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      dropdownRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node))
          setDropdowns((prev) =>
            prev.map((d, idx) => (idx === i ? { ...d, open: false } : d))
          );
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
    [openPortalDropdown, updateItem]
  );

  const handleSelectGoods = useCallback(
    (index: number, goods: AuditGoodsSearchResult, totalItems: number) => {
      onSelectGoods(index, goods);
      setDropdowns((prev) =>
        prev.map((d, i) =>
          i === index ? { suggestions: [], loading: false, open: false } : d
        )
      );
      setDropdownPos(null);
      if (index === totalItems - 1) onAddItem();
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
    dropdowns, dropdownPos,
    dropdownRefs, inputRefs,
    setDropdownPos,
    addDropdown, removeDropdown,
    handleGoodsIdChange, handleSelectGoods, handleInputFocus,
  };
}