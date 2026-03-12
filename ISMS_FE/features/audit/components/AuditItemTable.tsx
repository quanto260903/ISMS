// ============================================================
//  features/audit/components/AuditItemTable.tsx
//  Bảng hàng hóa kiểm kê — portal dropdown tìm kiếm
// ============================================================

"use client";

import React from "react";
import { createPortal } from "react-dom";
import type {
  AuditItem,
  AuditGoodsSearchResult,
  DropdownState,
  DropdownPos,
} from "../types/audit.types";

interface Props {
  items:        AuditItem[];
  dropdowns:    DropdownState[];
  dropdownPos:  DropdownPos | null;
  dropdownRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  inputRefs:    React.MutableRefObject<(HTMLInputElement | null)[]>;
  onUpdateItem: (index: number, field: keyof AuditItem, value: unknown) => void;
  onRemoveItem: (index: number) => void;
  onGoodsIdChange: (index: number, value: string, total: number) => void;
  onInputFocus: (index: number, e: React.FocusEvent<HTMLInputElement>) => void;
  onSelectGoods: (index: number, goods: AuditGoodsSearchResult, total: number) => void;
  onSetDropdownPos: (pos: DropdownPos | null) => void;
}

const COLS = [
  { label: "Mã hàng hóa",           width: "13%" },
  { label: "Tên hàng hóa",           width: "22%" },
  { label: "ĐVT",                    width: "7%"  },
  { label: "SL tồn kho",             width: "10%" },
  { label: "SL thực tế",             width: "10%" },
  { label: "Chênh lệch",             width: "10%" },
  { label: "Nguyên nhân",            width: "14%" },
  { label: "Xử lý",                  width: "9%"  },
  { label: "",                        width: "5%"  },
];

export default function AuditItemTable({
  items, dropdowns, dropdownPos, dropdownRefs, inputRefs,
  onUpdateItem, onRemoveItem,
  onGoodsIdChange, onInputFocus, onSelectGoods, onSetDropdownPos,
}: Props) {
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <colgroup>
            {COLS.map((c, i) => <col key={i} style={{ width: c.width }} />)}
          </colgroup>
          <thead>
            <tr>
              {COLS.map((c, i) => (
                <th key={i} style={s.th}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const dd   = dropdowns[index];
              const diff = item.difference;

              // Màu chênh lệch
              const diffColor =
                diff > 0 ? "#16a34a" :
                diff < 0 ? "#dc2626" :
                item.goodsId ? "#64748b" : "transparent";

              // Màu xử lý badge
              const actionBg =
                item.action === "Nhập kho" ? "#dcfce7" :
                item.action === "Xuất kho" ? "#fee2e2" :
                item.action === "Khớp"     ? "#f0f9ff" : "transparent";
              const actionColor =
                item.action === "Nhập kho" ? "#15803d" :
                item.action === "Xuất kho" ? "#b91c1c" :
                item.action === "Khớp"     ? "#0369a1" : "#64748b";

              return (
                <tr
                  key={index}
                  style={{
                    background: index % 2 === 0 ? "#fff" : "#fafbff",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget as HTMLTableRowElement).style.background = "#f0f4ff"
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      index % 2 === 0 ? "#fff" : "#fafbff"
                  }
                >
                  {/* Mã hàng — autocomplete */}
                  <td style={s.td}>
                    <div
                      style={{ position: "relative" }}
                      ref={(el) => { dropdownRefs.current[index] = el; }}
                    >
                      <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        style={{
                          ...s.inputCell,
                          borderColor: !item.goodsId && index < items.length - 1
                            ? "#fca5a5" : "#e2e8f0",
                        }}
                        placeholder="Nhập mã..."
                        value={item.goodsId}
                        onChange={(e) =>
                          onGoodsIdChange(index, e.target.value, items.length)
                        }
                        onFocus={(e) => onInputFocus(index, e)}
                      />
                      {dd?.loading && (
                        <span style={s.spinner}>⏳</span>
                      )}
                    </div>
                  </td>

                  {/* Tên hàng — readonly */}
                  <td style={s.td}>
                    <div style={s.readonlyCell} title={item.goodsName}>
                      {item.goodsName || <span style={s.placeholder}>—</span>}
                    </div>
                  </td>

                  {/* ĐVT — readonly */}
                  <td style={{ ...s.td, textAlign: "center" }}>
                    <div style={{ ...s.readonlyCell, textAlign: "center", color: "#64748b" }}>
                      {item.unit || "—"}
                    </div>
                  </td>

                  {/* SL tồn kho — readonly, tự điền */}
                  <td style={s.td}>
                    <div style={{ ...s.readonlyCell, textAlign: "right", color: "#1e293b", fontWeight: 600 }}>
                      {item.goodsId
                        ? item.stockQuantity.toLocaleString("vi-VN")
                        : "—"}
                    </div>
                  </td>

                  {/* SL thực tế — người dùng nhập */}
                  <td style={s.td}>
                    <input
                      style={{
                        ...s.inputCell,
                        textAlign: "right",
                        fontWeight: 600,
                        background: item.goodsId ? "#fff" : "#f8fafc",
                      }}
                      type="number"
                      min={0}
                      value={item.goodsId ? item.actualQuantity : ""}
                      placeholder="0"
                      disabled={!item.goodsId}
                      onChange={(e) =>
                        onUpdateItem(index, "actualQuantity", Number(e.target.value))
                      }
                    />
                  </td>

                  {/* Chênh lệch — tự tính */}
                  <td style={{ ...s.td, textAlign: "right" }}>
                    {item.goodsId ? (
                      <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "flex-end", gap: 4,
                        fontWeight: 700, fontSize: 13,
                        color: diffColor,
                      }}>
                        {diff > 0 && <span style={s.diffArrowUp}>▲</span>}
                        {diff < 0 && <span style={s.diffArrowDown}>▼</span>}
                        {diff === 0 && <span style={{ color: "#94a3b8" }}>—</span>}
                        {diff !== 0 &&
                          Math.abs(diff).toLocaleString("vi-VN")}
                      </div>
                    ) : (
                      <span style={s.placeholder}>—</span>
                    )}
                  </td>

                  {/* Nguyên nhân — tự điền */}
                  <td style={s.td}>
                    <div style={{ ...s.readonlyCell, fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
                      {item.reason || "—"}
                    </div>
                  </td>

                  {/* Xử lý — badge tự điền */}
                  <td style={{ ...s.td, textAlign: "center" }}>
                    {item.action ? (
                      <span style={{
                        display: "inline-block",
                        padding: "3px 10px", borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                        background: actionBg, color: actionColor,
                        border: `1px solid ${actionColor}33`,
                        whiteSpace: "nowrap",
                      }}>
                        {item.action}
                      </span>
                    ) : (
                      <span style={s.placeholder}>—</span>
                    )}
                  </td>

                  {/* Xóa */}
                  <td style={{ ...s.td, textAlign: "center" }}>
                    {items.length > 1 && (
                      <button
                        style={s.deleteBtn}
                        onClick={() => onRemoveItem(index)}
                        title="Xóa dòng"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Portal dropdown tìm kiếm hàng hóa ── */}
      {dropdownPos && (() => {
        const dd = dropdowns[dropdownPos.index];
        const item = items[dropdownPos.index];
        const shouldShow =
          dd?.open &&
          (item?.goodsId ?? "").trim() !== "" &&
          typeof document !== "undefined";

        if (!shouldShow) return null;

        return createPortal(
          <div style={{
            position: "absolute",
            top:      dropdownPos.top,
            left:     dropdownPos.left,
            width:    dropdownPos.width,
            zIndex:   99999,
            background: "#fff",
            border:   "1.5px solid #c7d7ff",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
            maxHeight: 280,
            overflowY: "auto",
          }}>
            {/* Header */}
            <div style={s.dropHeader}>
              {dd.loading
                ? "⏳ Đang tìm kiếm..."
                : `🔍 ${dd.suggestions.length} kết quả`
              }
            </div>

            {/* Loading */}
            {dd.loading && (
              <div style={s.dropSkeleton}>
                <div style={s.skeletonId} /><div style={s.skeletonName} />
              </div>
            )}

            {/* Kết quả */}
            {!dd.loading && dd.suggestions.map((g) => (
              <div
                key={g.goodsId}
                style={s.dropItem}
                onMouseEnter={(e) =>
                  (e.currentTarget as HTMLDivElement).style.background = "#eff6ff"
                }
                onMouseLeave={(e) =>
                  (e.currentTarget as HTMLDivElement).style.background = "transparent"
                }
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectGoods(dropdownPos.index, g, items.length);
                }}
              >
                <span style={s.dropId}>{g.goodsId}</span>
                <div style={s.dropRight}>
                  <span style={s.dropName}>{g.goodsName}</span>
                  <span style={s.dropMeta}>
                    ĐVT: {g.unit} · Tồn: <strong>{g.itemOnHand.toLocaleString("vi-VN")}</strong>
                  </span>
                </div>
              </div>
            ))}

            {!dd.loading && dd.suggestions.length === 0 && (
              <div style={s.dropEmpty}>Không tìm thấy hàng hóa</div>
            )}
          </div>,
          document.body
        );
      })()}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  table: {
    width: "100%", tableLayout: "fixed",
    borderCollapse: "collapse", fontSize: 13,
  },
  th: {
    padding: "10px 8px",
    background: "linear-gradient(180deg, #1e40af 0%, #1d4ed8 100%)",
    color: "#fff", textAlign: "left",
    fontWeight: 600, fontSize: 11,
    whiteSpace: "nowrap", letterSpacing: "0.04em",
    borderBottom: "2px solid #1e3a8a",
  },
  td: {
    padding: "5px 6px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  inputCell: {
    width: "100%", height: 32, padding: "0 8px",
    border: "1.5px solid #e2e8f0", borderRadius: 6,
    fontSize: 12, outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  readonlyCell: {
    padding: "0 6px", fontSize: 12, color: "#1e293b",
    whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis",
  },
  placeholder: { color: "#cbd5e1", fontSize: 12 },
  spinner: {
    position: "absolute", right: 6, top: "50%",
    transform: "translateY(-50%)", fontSize: 12, pointerEvents: "none",
  },
  diffArrowUp:   { fontSize: 9, lineHeight: 1 },
  diffArrowDown: { fontSize: 9, lineHeight: 1 },
  deleteBtn: {
    width: 26, height: 26, border: "none",
    background: "#fee2e2", color: "#b91c1c",
    borderRadius: 6, cursor: "pointer",
    fontSize: 11, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto",
  },
  dropHeader: {
    padding: "6px 12px", fontSize: 11, fontWeight: 700,
    color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em",
    borderBottom: "1px solid #f1f5f9",
  },
  dropSkeleton: {
    display: "flex", gap: 10, padding: "10px 12px", alignItems: "center",
  },
  skeletonId:   { width: 72, height: 20, borderRadius: 4, background: "#f1f5f9", flexShrink: 0 },
  skeletonName: { flex: 1,   height: 16, borderRadius: 4, background: "#f8fafc" },
  dropItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", cursor: "pointer", transition: "background 0.1s",
  },
  dropId: {
    display: "inline-block", padding: "2px 8px",
    background: "#eff6ff", color: "#1d4ed8",
    border: "1px solid #bfdbfe", borderRadius: 5,
    fontSize: 11, fontWeight: 700,
    whiteSpace: "nowrap" as const, flexShrink: 0,
  },
  dropRight:  { display: "flex", flexDirection: "column" as const, gap: 2, minWidth: 0 },
  dropName:   {
    fontSize: 13, fontWeight: 600, color: "#1e293b",
    whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis",
  },
  dropMeta:   { fontSize: 11, color: "#94a3b8" },
  dropEmpty:  { padding: "14px 12px", textAlign: "center" as const, color: "#94a3b8", fontSize: 13 },
};