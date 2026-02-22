// ============================================================
//  features/sale/components/WarehouseReportModal.tsx
//  Tồn kho theo lô nhập — click vào dòng để điền kho vào chứng từ
// ============================================================

import React, { useState } from "react";
import styles from "@/shared/styles/sale.styles";
import type { WarehouseReportState, WarehouseTransactionDto } from "../types/sale.types";

interface Props {
  report: WarehouseReportState | null;
  onClose: () => void;
  // Callback khi chọn 1 lô: trả về itemIndex + thông tin kho để điền ngược vào chứng từ
  onSelectWarehouse: (itemIndex: number, row: WarehouseTransactionDto) => void;
}

const fmt     = (n: number) => n.toLocaleString("vi-VN");
const fmtVnd  = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " ₫";
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export default function WarehouseReportModal({ report, onClose, onSelectWarehouse }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!report) return null;

  const totalIn     = report.data.reduce((s, r) => s + r.warehouseIn,  0);
  const totalOut    = report.data.reduce((s, r) => s + r.warehouseOut, 0);
  const totalInHand = report.data.reduce((s, r) => s + r.customInHand, 0);
  const totalCost   = report.data.reduce((s, r) => s + r.cost,         0);
  const avgPriceAll = totalIn > 0 ? totalCost / totalIn : 0;

  const COLS: { label: string; align?: React.CSSProperties["textAlign"] }[] = [
    { label: "",              align: "center" }, // icon chọn
    { label: "#",             align: "center" },
    { label: "Ngày nhập"                      },
    { label: "Phiếu nhập"                     },
    { label: "Kho xuất"                       },
    { label: "Đã nhập",      align: "right"  },
    { label: "Đã xuất",      align: "right"  },
    { label: "Còn tồn",      align: "right"  },
    { label: "Giá trị nhập", align: "right"  },
    { label: "Đơn giá TB",   align: "right"  },
  ];

  const handleRowClick = (row: WarehouseTransactionDto, i: number) => {
    setSelectedIndex(i);
    onSelectWarehouse(report.itemIndex, row);
    // Đóng modal sau khi chọn để user thấy kết quả điền vào
    setTimeout(() => {
      onClose();
      setSelectedIndex(null);
    }, 300);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{ ...styles.modalBox, width: "min(96vw, 1060px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>Chọn lô hàng để xuất kho</div>
            <div style={styles.modalSubtitle}>
              <span style={{ marginRight: 6 }}>
                {report.goodsId}{report.goodsName && ` — ${report.goodsName}`}
              </span>
              {report.data.length > 0 && (
                <>
                  <span style={s.chip}>🗂 {report.data.length} lô</span>
                  <span style={{ ...s.chip, background: "#f0fff4", color: "#1a7a3a", border: "1px solid #86efac" }}>
                    📦 Tồn: {fmt(totalInHand)}
                  </span>
                  <span style={{ ...s.chip, background: "#f0f4ff", color: "#2255cc", border: "1px solid #c7d7ff" }}>
                    💰 {fmtVnd(totalCost)}
                  </span>
                </>
              )}
            </div>
            {/* Hướng dẫn */}
            {report.data.length > 0 && (
              <div style={s.hint}>
                👆 Bấm vào dòng để chọn kho xuất hàng cho sản phẩm này
              </div>
            )}
          </div>
          <button style={styles.modalClose} onClick={onClose} title="Đóng">✕</button>
        </div>

        {/* ── Body ── */}
        <div style={styles.modalBody}>
          {report.loading && (
            <div style={styles.modalStatus}>⏳ Đang tải dữ liệu...</div>
          )}
          {report.error && (
            <div style={{ ...styles.modalStatus, color: "#cc2222" }}>⚠️ {report.error}</div>
          )}
          {!report.loading && !report.error && report.data.length === 0 && (
            <div style={styles.modalStatus}>Không có lô hàng nào còn tồn kho.</div>
          )}

          {!report.loading && report.data.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {COLS.map(({ label, align }) => (
                      <th key={label} style={{ ...styles.th, textAlign: align ?? "left" }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {report.data.map((row, i) => {
                    const avgPrice = row.warehouseIn > 0 ? row.cost / row.warehouseIn : 0;
                    const pct = Math.min(
                      row.warehouseIn > 0 ? (row.warehouseOut / row.warehouseIn) * 100 : 0,
                      100
                    );
                    const isLow      = row.customInHand <= 5;
                    const isSelected = selectedIndex === i;

                    return (
                      <tr
                        key={i}
                        onClick={() => handleRowClick(row, i)}
                        style={{
                          background:  isSelected ? "#dbeafe" : i % 2 === 0 ? "#fff" : "#f8f9ff",
                          cursor:      "pointer",
                          transition:  "background 0.15s",
                          outline:     isSelected ? "2px solid #2255cc" : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            (e.currentTarget as HTMLTableRowElement).style.background = "#eff6ff";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              i % 2 === 0 ? "#fff" : "#f8f9ff";
                        }}
                      >
                        {/* Icon chọn */}
                        <td style={{ ...styles.td, textAlign: "center", width: 32 }}>
                          {isSelected
                            ? <span style={{ color: "#2255cc", fontSize: 16 }}>✓</span>
                            : <span style={{ color: "#ccc", fontSize: 14 }}>○</span>}
                        </td>

                        {/* STT */}
                        <td style={{ ...styles.td, textAlign: "center", color: "#aaa", width: 32 }}>
                          {i + 1}
                        </td>

                        {/* Ngày nhập */}
                        <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                          {fmtDate(row.voucherDate)}
                        </td>

                        {/* Phiếu nhập gốc */}
                        <td style={styles.td}>
                          <span style={s.voucherTag}>📄 {row.offsetVoucher || "—"}</span>
                        </td>

                        {/* Tên kho */}
                        <td style={styles.td}>
                          {row.warehouseName
                            ? <span style={s.warehouseTag}>🏭 {row.warehouseName}</span>
                            : <span style={{ color: "#ccc" }}>—</span>}
                        </td>

                        {/* Đã nhập */}
                        <td style={{ ...styles.td, textAlign: "right", color: "#1a7a3a", fontWeight: 600 }}>
                          {fmt(row.warehouseIn)}
                        </td>

                        {/* Đã xuất + progress bar */}
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                            <div style={s.track}>
                              <div style={{ ...s.bar, width: `${pct}%` }} />
                            </div>
                            <span style={{ color: "#cc2222", fontWeight: 600 }}>
                              {fmt(row.warehouseOut)}
                            </span>
                          </div>
                        </td>

                        {/* Còn tồn */}
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <span style={{
                            ...s.badge,
                            background: isLow ? "#fff0f0" : "#f0fff4",
                            color:      isLow ? "#cc2222" : "#1a7a3a",
                            border:     `1px solid ${isLow ? "#ffcccc" : "#86efac"}`,
                          }}>
                            {fmt(row.customInHand)}{isLow && " ⚠️"}
                          </span>
                        </td>

                        {/* Giá trị nhập */}
                        <td style={{ ...styles.td, textAlign: "right", color: "#555" }}>
                          {fmtVnd(row.cost)}
                        </td>

                        {/* Đơn giá TB */}
                        <td style={{ ...styles.td, textAlign: "right", color: "#2255cc", fontWeight: 600 }}>
                          {fmtVnd(avgPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr style={{ background: "#eef2ff", fontWeight: 700 }}>
                    <td style={styles.td} colSpan={5}>Tổng cộng</td>
                    <td style={{ ...styles.td, textAlign: "right", color: "#1a7a3a" }}>{fmt(totalIn)}</td>
                    <td style={{ ...styles.td, textAlign: "right", color: "#cc2222" }}>{fmt(totalOut)}</td>
                    <td style={{ ...styles.td, textAlign: "right", color: "#1a3a99" }}>{fmt(totalInHand)}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{fmtVnd(totalCost)}</td>
                    <td style={{ ...styles.td, textAlign: "right", color: "#2255cc" }}>{fmtVnd(avgPriceAll)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Local styles ── */
const s: Record<string, React.CSSProperties> = {
  chip: {
    display: "inline-block",
    marginLeft: 6,
    padding: "1px 8px",
    background: "#f0f0f0",
    color: "#555",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    border: "1px solid #e0e0e0",
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#2255cc",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 4,
    padding: "4px 10px",
    display: "inline-block",
  },
  voucherTag: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#f0f4ff",
    color: "#2255cc",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid #c7d7ff",
    whiteSpace: "nowrap",
  },
  warehouseTag: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#fefce8",
    color: "#854d0e",
    borderRadius: 4,
    fontSize: 12,
    border: "1px solid #fde68a",
    whiteSpace: "nowrap",
  },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 4,
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  track: {
    width: 52,
    height: 5,
    background: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    background: "#f87171",
    borderRadius: 3,
  },
};