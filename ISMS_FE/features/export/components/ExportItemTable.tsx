// ============================================================
//  features/export/components/ExportItemTable.tsx
//  Bảng chi tiết hàng xuất kho
// ============================================================

"use client";

import React from "react";
import styles from "@/shared/styles/sale.styles";
import { EXPORT_TABLE_COLUMNS } from "../constants/export.constants";
import type { ExportItem, GoodsSearchResult, DropdownState, DropdownPos } from "../types/export.types";

// ExportItem mở rộng với offsetVoucher
export type ExportItemWithLot = ExportItem & { offsetVoucher?: string };

interface Props {
  items:        ExportItemWithLot[];
  dropdowns:    DropdownState[];
  dropdownPos:  DropdownPos | null;
  dropdownRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  inputRefs:    React.MutableRefObject<(HTMLInputElement | null)[]>;
  onUpdateItem:     (index: number, field: keyof ExportItemWithLot, value: unknown) => void;
  onRemoveItem:     (index: number) => void;
  onGoodsIdChange:  (index: number, value: string) => void;
  onInputFocus:     (index: number, e: React.FocusEvent<HTMLInputElement>) => void;
  onSelectGoods:    (index: number, goods: GoodsSearchResult, totalItems: number) => void;
  onSetDropdownPos: (pos: DropdownPos | null) => void;
  onRowClick?:      (index: number) => void;
  viewOnly?:        boolean;
}

export default function ExportItemTable({
  items, dropdowns, dropdownPos, dropdownRefs, inputRefs,
  onUpdateItem, onRemoveItem, onGoodsIdChange, onInputFocus,
  onSelectGoods, onSetDropdownPos, onRowClick, viewOnly = false,
}: Props) {
  return (
    <>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={styles.itemTable}>
          <thead>
            <tr>
              {EXPORT_TABLE_COLUMNS.map(({ label, w }) => (
                <th key={label} style={{ ...styles.itemTh, width: w, minWidth: w, maxWidth: w }}>
                  {label}
                </th>
              ))}
              
            </tr>
          </thead>
          <tbody>
            {(viewOnly ? items.filter((it) => it.goodsId.trim() !== "") : items).map((item, index) => {
              const dd = dropdowns[index] ?? { suggestions: [], loading: false, open: false };

              return (
                <tr
                  key={index}
                  style={{
                    background: index % 2 === 0 ? "#fff" : "#f8f9ff",
                    cursor: item.goodsId ? "pointer" : "default",
                  }}
                  title={item.goodsId ? "Click để chỉnh sửa chứng từ đối trừ" : undefined}
                  onClick={(e) => {
                    if (!item.goodsId || !onRowClick) return;
                    const tag = (e.target as HTMLElement).tagName.toLowerCase();
                    if (tag === "tr" || tag === "td") onRowClick(index);
                  }}
                >

                  {/* # */}
                  <td style={{ ...styles.itemTd, textAlign: "center", color: "#999", width: 32 }}>
                    {index + 1}
                  </td>

                  {/* Mã hàng + autocomplete */}
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
                      value={item.goodsName} readOnly tabIndex={-1}
                      placeholder="Tự động điền"
                    />
                  </td>

                  {/* Đơn vị — readonly */}
                  <td style={{ ...styles.itemTd, width: 50 }}>
                    <input
                      style={{ ...styles.inputTable, background: "#f4f4f4", color: "#555", textAlign: "center" }}
                      value={item.unit} readOnly tabIndex={-1}
                    />
                  </td>

                  {/* Số lượng */}
                  <td style={{ ...styles.itemTd, width: 60 }}>
                    <input type="number" min={1}
                      style={{ ...styles.inputTable, textAlign: "right", ...(viewOnly ? { background: "#f5f5f5", color: "#555" } : {}) }}
                      value={item.quantity}
                      readOnly={viewOnly}
                      onChange={(e) => !viewOnly && onUpdateItem(index, "quantity", Number(e.target.value))}
                    />
                  </td>

                  {/* Đơn giá */}
                  <td style={{ ...styles.itemTd, width: 100 }}>
                    <input type="number" min={0}
                      style={{ ...styles.inputTable, textAlign: "right", ...(viewOnly ? { background: "#f5f5f5", color: "#555" } : {}) }}
                      value={item.unitPrice}
                      readOnly={viewOnly}
                      onChange={(e) => !viewOnly && onUpdateItem(index, "unitPrice", Number(e.target.value))}
                    />
                  </td>

                  {/* Thành tiền */}
                  <td style={{ ...styles.itemTd, width: 105, textAlign: "right", color: "#2255cc", fontWeight: 700 }}>
                    {item.amount1.toLocaleString("vi-VN")}
                  </td>

                  {/* CT đối trừ — nhập tay hoặc tự điền từ WarehouseReportModal */}
                  <td style={{ ...styles.itemTd, width: 110 }}>
                    <input
                      style={{
                        ...styles.inputTable,
                        background: viewOnly ? "#f5f5f5" : (item.offsetVoucher ? "#f0fdf4" : undefined),
                        color:      item.offsetVoucher ? "#15803d" : undefined,
                        fontWeight: item.offsetVoucher ? 600 : undefined,
                      }}
                      placeholder="Phiếu nhập gốc..."
                      value={item.offsetVoucher ?? ""}
                      readOnly={viewOnly}
                      onChange={(e) => !viewOnly && onUpdateItem(index, "offsetVoucher", e.target.value)}
                    />
                  </td>

                  {/* Actions: Xóa (ẩn khi chỉ xem) */}
                  {!viewOnly && (
                    <td style={{ ...styles.itemTd, width: 80, textAlign: "center" }}>
                      <button style={styles.btnDanger} onClick={() => onRemoveItem(index)}>
                        Xóa
                      </button>
                    </td>
                  )}
                  {viewOnly && <td style={{ ...styles.itemTd, width: 80 }} />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Portal dropdown */}
      {dropdownPos && (() => {
        const dd = dropdowns[dropdownPos.index];
        if (!dd) return null;
        const hasResults = dd.open && dd.suggestions.length > 0;
        const isEmpty    = dd.open && !dd.loading && dd.suggestions.length === 0
          && (items[dropdownPos.index]?.goodsId ?? "").trim() !== "";
        if (!hasResults && !isEmpty) return null;
        return (
          <div style={{
            position: "fixed", top: dropdownPos.top, left: dropdownPos.left,
            width: dropdownPos.width, zIndex: 99999, background: "#fff",
            border: "1px solid #ccc", borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}>
            {hasResults && (
              <ul style={{ listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 280, overflowY: "auto" }}>
                {dd.suggestions.map((g) => (
                  <li key={g.goodsId} style={styles.dropdownItem}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = "#f0f4ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLLIElement).style.background = "transparent")}
                    onMouseDown={() => { onSelectGoods(dropdownPos.index, g, items.length); onSetDropdownPos(null); }}>
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