// ============================================================
//  features/sale/components/SaleItemTable.tsx
//  Bảng danh sách sản phẩm trong đơn bán hàng
// ============================================================

"use client";

import React from "react";
import styles from "@/shared/styles/sale.styles";
import { VAT_OPTIONS, ITEM_TABLE_COLUMNS } from "../constants/sale.constants";
import type {
  VoucherItem,
  GoodsSearchResult,
  DropdownState,
  DropdownPos,
} from "../types/sale.types";

interface Props {
  items: VoucherItem[];
  dropdowns: DropdownState[];
  dropdownPos: DropdownPos | null;
  dropdownRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onUpdateItem: (index: number, field: keyof VoucherItem, value: unknown) => void;
  onRemoveItem: (index: number) => void;
  onGoodsIdChange: (index: number, value: string) => void;
  onInputFocus: (index: number, e: React.FocusEvent<HTMLInputElement>) => void;
  onSelectGoods: (index: number, goods: GoodsSearchResult, totalItems: number) => void;
  onSetDropdownPos: (pos: DropdownPos | null) => void;
  onSetDropdownOpen: (index: number, open: boolean) => void;
  onViewWarehouse: (itemIndex: number, goodsId: string, goodsName: string) => void;
}

export default function SaleItemTable({
  items,
  dropdowns,
  dropdownPos,
  dropdownRefs,
  inputRefs,
  onUpdateItem,
  onRemoveItem,
  onGoodsIdChange,
  onInputFocus,
  onSelectGoods,
  onSetDropdownPos,
  onViewWarehouse,
}: Props) {
  return (
    <>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={styles.itemTable}>
          <thead>
            <tr>
              {ITEM_TABLE_COLUMNS.map(({ label, w }) => (
                <th key={label} style={{ ...styles.itemTh, width: w, minWidth: w, maxWidth: w }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const dd = dropdowns[index] ?? { suggestions: [], loading: false, open: false };
              const vatAmount = item.amount1 * (item.vat / 100);

              return (
                <tr key={index} style={{ background: index % 2 === 0 ? "#fff" : "#f8f9ff" }}>

                  {/* STT */}
                  <td style={{ ...styles.itemTd, textAlign: "center", color: "#999", width: 32 }}>
                    {index + 1}
                  </td>

                  {/* Mã hàng + dropdown portal */}
                  <td style={{ ...styles.itemTd, width: 110 }}>
                    <div
                      style={{ position: "relative" }}
                      ref={(el) => { dropdownRefs.current[index] = el; }}
                    >
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

                  {/* Tên hàng - readonly */}
                  <td style={{ ...styles.itemTd, width: 160 }}>
                    <input
                      style={{ ...styles.inputTable, background: "#f4f4f4", color: "#555" }}
                      value={item.goodsName}
                      readOnly tabIndex={-1}
                      placeholder="Tự động điền"
                    />
                  </td>

                  {/* Đơn vị - readonly */}
                  <td style={{ ...styles.itemTd, width: 50 }}>
                    <input
                      style={{ ...styles.inputTable, background: "#f4f4f4", color: "#555", textAlign: "center" }}
                      value={item.unit}
                      readOnly tabIndex={-1}
                    />
                  </td>

                  {/* Số lượng */}
                  <td style={{ ...styles.itemTd, width: 58 }}>
                    <input
                      type="number" min={1}
                      style={{ ...styles.inputTable, textAlign: "right" }}
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(index, "quantity", Number(e.target.value))}
                    />
                  </td>

                  {/* Đơn giá */}
                  <td style={{ ...styles.itemTd, width: 95 }}>
                    <input
                      type="number"
                      style={{ ...styles.inputTable, textAlign: "right" }}
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(index, "unitPrice", Number(e.target.value))}
                    />
                  </td>

                  {/* Giá mua */}
                  <td style={{ ...styles.itemTd, width: 95 }}>
                    <input
                      type="number"
                      style={{ ...styles.inputTable, textAlign: "right" }}
                      value={item.amount2}
                      onChange={(e) => onUpdateItem(index, "amount2", Number(e.target.value))}
                    />
                  </td>

                  {/* Khuyến mãi */}
                  <td style={{ ...styles.itemTd, width: 75 }}>
                    <input
                      type="number" min={0}
                      style={{ ...styles.inputTable, textAlign: "right" }}
                      value={item.promotion}
                      onChange={(e) => onUpdateItem(index, "promotion", Number(e.target.value))}
                    />
                  </td>

                  {/* Thuế VAT */}
                  <td style={{ ...styles.itemTd, width: 72 }}>
                    <select
                      style={styles.selectVat}
                      value={item.vat}
                      onChange={(e) => onUpdateItem(index, "vat", Number(e.target.value))}
                    >
                      {VAT_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}%</option>
                      ))}
                    </select>
                  </td>

                  {/* Tiền VAT */}
                  <td style={{ ...styles.itemTd, width: 85, textAlign: "right", color: "#b45309", fontWeight: 600 }}>
                    {vatAmount.toLocaleString("vi-VN")}
                  </td>

                  {/* Thành tiền */}
                  <td style={{ ...styles.itemTd, width: 95, textAlign: "right", color: "#2255cc", fontWeight: 700 }}>
                    {item.amount1.toLocaleString("vi-VN")}
                  </td>

                  {/* CT đối trừ */}
                  <td style={{ ...styles.itemTd, width: 95 }}>
                    <input
                      style={styles.inputTable}
                      placeholder="CT đối trừ..."
                      value={item.offsetVoucher}
                      onChange={(e) => onUpdateItem(index, "offsetVoucher", e.target.value)}
                    />
                  </td>

                  {/* Actions */}
                  <td style={{ ...styles.itemTd, width: 72, textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {item.goodsId.trim() && (
                        <button
                          style={styles.btnDetail}
                          onClick={() => onViewWarehouse(index, item.goodsId, item.goodsName)}
                          title="Xem báo cáo xuất nhập kho"
                        >
                          📦 Kho
                        </button>
                      )}
                      <button style={styles.btnDanger} onClick={() => onRemoveItem(index)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Portal dropdown — render ngoài bảng để không bị overflow:hidden cắt */}
      {dropdownPos && (() => {
        const dd = dropdowns[dropdownPos.index];
        if (!dd) return null;
        const hasResults = dd.open && dd.suggestions.length > 0;
        const isEmpty =
          dd.open &&
          !dd.loading &&
          dd.suggestions.length === 0 &&
          (items[dropdownPos.index]?.goodsId ?? "").trim() !== "";
        if (!hasResults && !isEmpty) return null;

        return (
          <div
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 99999,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
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
                      {g.unit} · {g.salePrice.toLocaleString("vi-VN")} ₫
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