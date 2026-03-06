// ============================================================
//  features/inward/components/InwardListPage.tsx
//  Trang chủ nhập kho — danh sách phiếu + nút tạo mới
// ============================================================

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useInwardList } from "../hooks/useInwardList";
import type { InwardListItem } from "../types/import.types";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "--";

const fmtMoney = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const VOUCHER_CODE_LABELS: Record<string, string> = {
  NK1: "Mua hàng - TM",
  NK2: "Mua hàng - NH",
  NK3: "Mua hàng - Nợ",
  NK4: "Hàng trả lại",
  NK5: "Khác",
};

const VOUCHER_CODE_COLORS: Record<string, { bg: string; color: string }> = {
  NK1: { bg: "#f0fdf4", color: "#16a34a" },
  NK2: { bg: "#eff6ff", color: "#2255cc" },
  NK3: { bg: "#fef9c3", color: "#854d0e" },
  NK4: { bg: "#fff0f0", color: "#cc2222" },
  NK5: { bg: "#f4f4f4", color: "#555"    },
};

export default function InwardListPage() {
  const router = useRouter();
  const {
    filters, handleFilterChange, handleSearch, handleRefresh,
    page, setPage, PAGE_SIZE,
    result, loading, error,
  } = useInwardList();

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <h2 style={s.title}>Nhập kho</h2>
        <button
          style={s.btnPrimary}
          onClick={() => router.push("/dashboard/import/new")}
        >
          + Thêm mới
        </button>
      </div>

      {/* ── Bộ lọc ── */}
      <div style={s.filterBar}>
        {/* Từ ngày */}
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Từ ngày</label>
          <input
            type="date" style={s.filterInput}
            value={filters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
          />
        </div>

        {/* Đến ngày */}
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Đến ngày</label>
          <input
            type="date" style={s.filterInput}
            value={filters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
          />
        </div>

        {/* Tìm kiếm */}
        <div style={{ ...s.filterGroup, flex: 1 }}>
          <label style={s.filterLabel}>Tìm kiếm</label>
          <input
            style={s.filterInput}
            placeholder="Nhập số phiếu, đối tượng..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        {/* Nút làm mới */}
        <button style={s.btnRefresh} onClick={handleRefresh} title="Làm mới">
          🔄
        </button>
      </div>

      {/* ── Bảng danh sách ── */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.theadRow}>
              <th style={s.th}><input type="checkbox" /></th>
              <th style={s.th}>Số hóa đơn</th>
              <th style={s.th}>Số phiếu</th>
              <th style={s.th}>Loại</th>
              <th style={s.th}>Thời gian</th>
              <th style={s.th}>Đối tượng</th>
              <th style={{ ...s.th, textAlign: "right" }}>Tổng tiền hàng</th>
              <th style={{ ...s.th, textAlign: "center" }}>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={s.statusCell}>⏳ Đang tải...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={8} style={{ ...s.statusCell, color: "#cc2222" }}>
                  ⚠️ {error}
                </td>
              </tr>
            )}
            {!loading && !error && result?.items.length === 0 && (
              <tr>
                <td colSpan={8} style={s.statusCell}>Không có phiếu nào.</td>
              </tr>
            )}
            {!loading && result?.items.map((row, i) => (
              <InwardRow key={row.voucherId} row={row} i={i} onEdit={() =>
                router.push(`/dashboard/inward/${row.voucherId}`)
              } />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer: tổng + phân trang ── */}
      {result && (
        <div style={s.footer}>
          <div style={s.grandTotal}>
            <span style={{ color: "#555", fontSize: 13 }}>Tổng số: <strong>{result.total}</strong></span>
            <span style={s.grandTotalAmount}>{fmtMoney(result.grandTotal)}</span>
          </div>

          <div style={s.pagination}>
            <span style={s.pageInfo}>
              Số bản ghi trên trang:
              <strong style={{ marginLeft: 4 }}>{PAGE_SIZE}</strong>
            </span>
            <span style={s.pageInfo}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, result.total)} / {result.total}
            </span>
            <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage(1)}>⟪</button>
            <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟫</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Row component ── */
function InwardRow({
  row, i, onEdit
}: { row: InwardListItem; i: number; onEdit: () => void }) {
  const [hover, setHover] = React.useState(false);
  const codeStyle = VOUCHER_CODE_COLORS[row.voucherCode ?? "NK5"] ?? VOUCHER_CODE_COLORS.NK5;

  return (
    <tr
      style={{
        background: hover ? "#f0f4ff" : i % 2 === 0 ? "#fff" : "#fafafa",
        transition: "background 0.1s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onEdit}
    >
      <td style={s.td} onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" />
      </td>
      <td style={s.td}>{row.invoiceNumber ?? "--"}</td>
      <td style={{ ...s.td, fontWeight: 600, color: "#2255cc" }}>{row.voucherId}</td>
      <td style={s.td}>
        {row.voucherCode && (
          <span style={{
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: codeStyle.bg,
            color: codeStyle.color,
            border: `1px solid ${codeStyle.color}33`,
            whiteSpace: "nowrap",
          }}>
            {VOUCHER_CODE_LABELS[row.voucherCode] ?? row.voucherCode}
          </span>
        )}
      </td>
      <td style={s.td}>{fmtDate(row.voucherDate)}</td>
      <td style={s.td}>{row.customerName ?? "--"}</td>
      <td style={{ ...s.td, textAlign: "right", fontWeight: 600 }}>
        {fmtMoney(row.totalAmount)}
      </td>
      <td style={{ ...s.td, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <button
          style={s.btnEdit}
          onClick={onEdit}
        >
          ✏️ Sửa
        </button>
      </td>
    </tr>
  );
}

/* ── Styles ── */
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px 28px",
    minHeight: "100vh",
    background: "#f8f9ff",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
  },
  btnPrimary: {
    padding: "9px 22px",
    background: "#2255cc",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  filterBar: {
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: 500,
  },
  filterInput: {
    height: 36,
    padding: "0 10px",
    border: "1.5px solid #dde",
    borderRadius: 7,
    fontSize: 13,
    background: "#fff",
    minWidth: 140,
  },
  btnRefresh: {
    height: 36,
    width: 36,
    border: "1.5px solid #dde",
    borderRadius: 7,
    background: "#fff",
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  tableWrap: {
    overflowX: "auto" as const,
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8eaf0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  theadRow: {
    background: "#f0f2f8",
  },
  th: {
    padding: "11px 14px",
    textAlign: "left" as const,
    fontWeight: 600,
    color: "#444",
    borderBottom: "2px solid #e0e4ef",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #f0f0f0",
    color: "#333",
    whiteSpace: "nowrap" as const,
  },
  statusCell: {
    padding: "32px",
    textAlign: "center" as const,
    color: "#999",
    fontSize: 14,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    padding: "12px 16px",
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e8eaf0",
  },
  grandTotal: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  grandTotalAmount: {
    fontSize: 16,
    fontWeight: 700,
    color: "#2255cc",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  pageInfo: {
    fontSize: 13,
    color: "#555",
    marginRight: 4,
  },
  pageBtn: {
    width: 30,
    height: 30,
    border: "1px solid #dde",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnEdit: {
    padding: "4px 12px",
    border: "1px solid #c7d7ff",
    borderRadius: 6,
    background: "#eff6ff",
    color: "#2255cc",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
};