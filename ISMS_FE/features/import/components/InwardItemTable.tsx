// ============================================================
//  features/inward/components/InwardItemTable.tsx
// ============================================================

"use client";

import React from "react";
import styles from "@/shared/styles/sale.styles";
import { INWARD_TABLE_COLUMNS } from "../constants/import.constants";
import type { InwardItem, GoodsSearchResult, DropdownState, DropdownPos } from "../types/import.types";

interface Props {
  items: InwardItem[];
  dropdowns: DropdownState[];
  dropdownPos: DropdownPos | null;
  dropdownRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onUpdateItem: (index: number, field: keyof InwardItem, value: unknown) => void;
  onRemoveItem: (index: number) => void;
  onGoodsIdChange: (index: number, value: string) => void;
  onInputFocus: (index: number, e: React.FocusEvent<HTMLInputElement>) => void;
  onSelectGoods: (index: number, goods: GoodsSearchResult, totalItems: number) => void;
  onSetDropdownPos: (pos: DropdownPos | null) => void;
  viewOnly?: boolean;
}

export default function InwardItemTable({
  items, dropdowns, dropdownPos, dropdownRefs, inputRefs,
  onUpdateItem, onRemoveItem, onGoodsIdChange, onInputFocus,
  onSelectGoods, onSetDropdownPos, viewOnly = false,
}: Props) {
  const setPromotion = (index: number, val: number) => {
  const clamped = Math.max(0, Math.min(val, 100));
  onUpdateItem(index, "promotion", clamped);
};
  return (
    <>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={styles.itemTable}>
          <thead>
            <tr>
              {INWARD_TABLE_COLUMNS.map(({ label, w }) => (
                <th key={label} style={{ ...styles.itemTh, width: w, minWidth: w, maxWidth: w }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(viewOnly ? items.filter((it) => it.goodsId.trim() !== "") : items).map((item, index) => {
              const dd = dropdowns[index] ?? { suggestions: [], loading: false, open: false };
              // Highlight dòng trống cuối để user biết đây là dòng placeholder
              const isEmpty = item.goodsId.trim() === "";

              return (
                <tr
                  key={index}
                  style={{
                    background: isEmpty
                      ? "#fffbf0"                                      // vàng nhạt cho dòng placeholder
                      : index % 2 === 0 ? "#fff" : "#f8f9ff",
                    opacity: isEmpty ? 0.7 : 1,
                  }}
                >
                  {/* # */}
                  <td style={{ ...styles.itemTd, textAlign: "center", color: "#999", width: 32 }}>
                    {isEmpty ? <span style={{ color: "#ccc" }}>—</span> : index + 1}
                  </td>

                  {/* Mã hàng + autocomplete dropdown */}
                  <td style={{ ...styles.itemTd, width: 110 }}>
                    <div style={{ position: "relative" }} ref={(el) => { dropdownRefs.current[index] = el; }}>
                      <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        style={{ ...styles.inputTable, paddingRight: dd.loading ? 26 : 6 }}
                        placeholder="Mã hàng..."
                        value={item.goodsId}
                        onChange={(e) => onGoodsIdChange(index, e.target.value)}
                        onFocus={(e) => onInputFocus(index, e)}
                        autoComplete="off"
                      />
                      {dd.loading && <span style={styles.spinner}>⏳</span>}
                    </div>
                  </td>

                  {/* Tên hàng — readonly */}
                  <td style={{ ...styles.itemTd, width: 160 }}>
                    <input
                      style={{ ...styles.inputTable, background: "#f4f4f4", color: "#555" }}
                      value={item.goodsName}
                      readOnly
                      tabIndex={-1}
                      placeholder="Tự động điền"
                    />
                  </td>

                  {/* Đơn vị — readonly */}
                  <td style={{ ...styles.itemTd, width: 50 }}>
                    <input
                      style={{ ...styles.inputTable, background: "#f4f4f4", color: "#555", textAlign: "center" }}
                      value={item.unit}
                      readOnly
                      tabIndex={-1}
                    />
                  </td>

                  {/* Số lượng */}
                  <td style={{ ...styles.itemTd, width: 70 }}>
                    <input
                      type="number"
                      min={1}
                      style={{ ...styles.inputTable, textAlign: "right" }}
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(index, "quantity", Number(e.target.value))}
                      disabled={isEmpty}
                      tabIndex={isEmpty ? -1 : undefined}
                    />
                  </td>

                  {/* Đơn giá */}
                  <td style={{ ...styles.itemTd, width: 110 }}>
                    <input
                      type="number"
                      min={0}
                      style={{ ...styles.inputTable, textAlign: "right" }}
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(index, "unitPrice", Number(e.target.value))}
                      disabled={isEmpty}
                      tabIndex={isEmpty ? -1 : undefined}
                    />
                  </td>

                  {/* Khuyến mãi % */}
                  <td style={{ ...styles.itemTd, width: 90 }}>
                    <input
  type="number"
  min={0}
  max={100}
  step={0.01}
  style={{ ...styles.inputTable, textAlign: "right" }}
  value={item.promotion === 0 ? "" : item.promotion}
  placeholder="0"
  onChange={(e) =>
    setPromotion(index, Number(e.target.value))
  }
  disabled={isEmpty}
  tabIndex={isEmpty ? -1 : undefined}
/>
                  </td>

                  {/* Thành tiền — tính tự động */}
                  <td style={{
                    ...styles.itemTd, width: 120,
                    textAlign: "right",
                    color: isEmpty ? "#ccc" : "#2255cc",
                    fontWeight: 700,
                  }}>
                    {isEmpty ? "—" : item.amount1.toLocaleString("vi-VN")}
                  </td>

                  {/* Xóa — ẩn khi dòng placeholder hoặc chế độ xem */}
                  <td style={{ ...styles.itemTd, width: 52, textAlign: "center" }}>
                    {!isEmpty && !viewOnly && (
                      <button style={styles.btnDanger} onClick={() => onRemoveItem(index)}>
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Portal dropdown — render ngoài table để không bị overflow cắt */}
      {dropdownPos && (() => {
        const dd = dropdowns[dropdownPos.index];
        if (!dd) return null;
        const hasResults = dd.open && dd.suggestions.length > 0;
        const isEmpty    = dd.open && !dd.loading && dd.suggestions.length === 0
          && (items[dropdownPos.index]?.goodsId ?? "").trim() !== "";
        if (!hasResults && !isEmpty) return null;

        return (
          <div style={{
            position: "fixed",
            top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
            zIndex: 99999,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}>
            {hasResults && (
              <ul style={{ listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 280, overflowY: "auto" }}>
                {dd.suggestions.map((g) => (
                  <li
                    key={g.goodsId}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = "#f0f4ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLLIElement).style.background = "transparent")}
                    onMouseDown={() => {
                      onSelectGoods(dropdownPos.index, g, items.length);
                      onSetDropdownPos(null);
                    }}
                  >
                    <span style={styles.dropdownId}>{g.goodsId}</span>
                    <span style={styles.dropdownName}>{g.goodsName}</span>
                    <span style={styles.dropdownMeta}>
                      {g.unit} · Tồn: {g.itemOnHand.toLocaleString("vi-VN")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {isEmpty && (
              <div style={{ padding: "10px 14px", fontSize: 13, color: "#999" }}>
                Không tìm thấy sản phẩm
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}