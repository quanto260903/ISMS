// ============================================================
//  shared/components/supplier/SupplierDropdown.tsx
//  Portal dropdown gợi ý NCC — render ở document.body
//  Dùng chung với SupplierSearchInput + useSupplierSearch
// ============================================================

"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { SupplierDropdownState, SupplierDropdownPos } from "@/shared/hooks/supplier/useSupplierSearch";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";

interface Props {
  dropdown:     SupplierDropdownState;
  dropdownPos:  SupplierDropdownPos | null;
  dropdownRef:  React.RefObject<HTMLDivElement>;
  onSelect:     (supplier: SupplierSearchResult) => void;
  onAddNew:     () => void;
  query:        string;                // text hiện tại trong ô input
}

export default function SupplierDropdown({
  dropdown, dropdownPos, dropdownRef,
  onSelect, onAddNew, query,
}: Props) {
  const shouldShow =
    dropdown.open &&
    dropdownPos !== null &&
    query.trim() !== "" &&
    typeof document !== "undefined";

  if (!shouldShow) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position:  "absolute",
        top:        dropdownPos!.top,
        left:       dropdownPos!.left,
        width:      dropdownPos!.width,
        zIndex:     99998,
        background: "#fff",
        border:     "1.5px solid #c7d7ff",
        borderRadius: 10,
        boxShadow:  "0 8px 32px rgba(0,0,0,0.16)",
        maxHeight:  300,
        overflowY:  "auto",
      }}
    >
      {/* Header */}
      <div style={s.header}>
        🏭 {dropdown.loading
          ? "Đang tìm..."
          : `${dropdown.suggestions.length} nhà cung cấp phù hợp`
        }
      </div>

      {/* Loading skeleton */}
      {dropdown.loading && (
        <div style={s.loadingRow}>
          <div style={s.skeletonId} />
          <div style={s.skeletonName} />
        </div>
      )}

      {/* Danh sách gợi ý */}
      {!dropdown.loading && dropdown.suggestions.map((sup) => (
        <div
          key={sup.supplierId}
          style={s.item}
          onMouseEnter={(e) =>
            (e.currentTarget as HTMLDivElement).style.background = "#eff6ff"}
          onMouseLeave={(e) =>
            (e.currentTarget as HTMLDivElement).style.background = "transparent"}
          onMouseDown={(e) => {
            e.preventDefault(); // tránh blur input trước khi select
            onSelect(sup);
          }}
        >
          <span style={s.idBadge}>{sup.supplierId}</span>
          <div style={s.itemRight}>
            <span style={s.itemName}>{sup.supplierName}</span>
            {(sup.taxId || sup.phone) && (
              <span style={s.itemMeta}>
                {sup.taxId  && `MST: ${sup.taxId}`}
                {sup.taxId  && sup.phone && " · "}
                {sup.phone  && `📞 ${sup.phone}`}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Không tìm thấy */}
      {!dropdown.loading && dropdown.suggestions.length === 0 && (
        <div style={s.empty}>Không tìm thấy nhà cung cấp nào</div>
      )}

      {/* Footer — tạo mới */}
      <div
        style={s.footer}
        onMouseDown={(e) => { e.preventDefault(); onAddNew(); }}
      >
        ➕ Tạo mới nhà cung cấp
      </div>
    </div>,
    document.body
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    padding: "7px 14px", fontSize: 11, fontWeight: 700,
    color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em",
    borderBottom: "1px solid #f1f5f9",
  },
  loadingRow: {
    display: "flex", gap: 10, padding: "10px 14px", alignItems: "center",
  },
  skeletonId: {
    width: 60, height: 20, borderRadius: 4, background: "#f1f5f9",
    flexShrink: 0,
  },
  skeletonName: {
    flex: 1, height: 16, borderRadius: 4, background: "#f8fafc",
  },
  item: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 14px", cursor: "pointer",
    transition: "background 0.1s",
  },
  idBadge: {
    display: "inline-block", padding: "2px 8px",
    background: "#eff6ff", color: "#2255cc",
    border: "1px solid #bfdbfe", borderRadius: 5,
    fontSize: 12, fontWeight: 700,
    whiteSpace: "nowrap" as const, flexShrink: 0,
  },
  itemRight: {
    display: "flex", flexDirection: "column" as const, gap: 1, minWidth: 0,
  },
  itemName: {
    fontSize: 14, fontWeight: 600, color: "#1e293b",
    whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis",
  },
  itemMeta: { fontSize: 11, color: "#94a3b8" },
  empty: {
    padding: "12px 14px", fontSize: 13,
    color: "#94a3b8", textAlign: "center" as const,
  },
  footer: {
    padding: "9px 14px", borderTop: "1px solid #f1f5f9",
    fontSize: 13, fontWeight: 600, color: "#6d28d9",
    cursor: "pointer",
  },
};