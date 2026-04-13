// ============================================================
//  features/inward/components/InwardListPage.tsx
//  Trang chủ nhập kho - danh sách phiếu và nút tạo mới
// ============================================================

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useInwardList } from "../hooks/useInwardList";
import type { InwardListItem } from "../types/import.types";

const fmtDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "--";

const fmtMoney = (value: number) =>
  value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const VOUCHER_CODE_LABELS: Record<string, string> = {
  NK1: "Mua hàng",
  NK2: "Hàng trả lại",
  NK3: "Nhập kiểm kê",
};

const VOUCHER_CODE_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  NK1: { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  NK2: { bg: "#fff1f2", color: "#b91c1c", border: "#fca5a5" },
  NK3: { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
  DEFAULT: { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },
};

export default function InwardListPage() {
  const router = useRouter();
  const {
    filters,
    handleFilterChange,
    handleSearch,
    handleRefresh,
    page,
    setPage,
    PAGE_SIZE,
    result,
    loading,
    error,
  } = useInwardList();

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  return (
    <div style={s.page}>
      <div style={s.heroBanner}>
        <div style={s.heroDecorOrb} />
        <div style={s.heroDecorOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>WMS Pro · Quản lý nhập kho</div>
          <h1 style={s.heroTitle}>Danh sách phiếu nhập kho</h1>
          <p style={s.heroSub}>
            Quản lý toàn bộ phiếu nhập, tra cứu và theo dõi tình trạng hàng hóa
          </p>
        </div>
        <button
          style={s.btnPrimary}
          onClick={() => router.push("/dashboard/import/new")}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Tạo phiếu nhập mới
        </button>
      </div>

      <div style={s.filterCard}>
        <div style={s.filterBar}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Từ ngày</label>
            <input
              type="date"
              style={s.filterInput}
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            />
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Đến ngày</label>
            <input
              type="date"
              style={s.filterInput}
              value={filters.toDate}
              onChange={(e) => handleFilterChange("toDate", e.target.value)}
            />
          </div>

          <div style={{ ...s.filterGroup, flex: 1 }}>
            <label style={s.filterLabel}>Tìm kiếm</label>
            <div style={{ position: "relative" }}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={{ ...s.filterInput, paddingLeft: 32, width: "100%" }}
                placeholder="Nhập số phiếu, đối tượng..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <button
            style={s.btnRefresh}
            onClick={handleRefresh}
            title="Làm mới dữ liệu"
          >
            <span style={{ fontSize: 15 }}>↻</span>
          </button>
        </div>
      </div>

      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr style={s.theadRow}>
              <th style={s.th}>
                <input type="checkbox" />
              </th>
              <th style={s.th}>Số hóa đơn</th>
              <th style={s.th}>Số phiếu</th>
              <th style={s.th}>Loại phiếu</th>
              <th style={s.th}>Thời gian</th>
              <th style={s.th}>Đối tượng</th>
              <th style={{ ...s.th, textAlign: "right" }}>Tổng tiền hàng</th>
              <th style={{ ...s.th, textAlign: "center" }}>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={s.statusCell}>
                  <div style={s.loadingSpinner}>
                    <div style={s.spinnerRing} />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={8} style={s.statusCell}>
                  <div style={s.errorBox}>⚠️ {error}</div>
                </td>
              </tr>
            )}

            {!loading && !error && result?.items.length === 0 && (
              <tr>
                <td colSpan={8} style={s.statusCell}>
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📦</div>
                    <p style={{ fontWeight: 600, color: "#374151" }}>
                      Chưa có phiếu nào
                    </p>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                      Nhấn "Tạo phiếu nhập mới" để bắt đầu
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              result?.items.map((row, index) => (
                <InwardRow
                  key={row.voucherId}
                  row={row}
                  index={index}
                  onView={() =>
                    router.push(`/dashboard/import/${row.voucherId}?mode=view`)
                  }
                  onEdit={() => router.push(`/dashboard/import/${row.voucherId}`)}
                />
              ))}
          </tbody>
        </table>
      </div>

      {result && (
        <div style={s.footer}>
          <div style={s.grandTotal}>
            <span style={{ color: "#64748b", fontSize: 13 }}>
              Tổng số:{" "}
              <strong style={{ color: "#1e293b" }}>{result.total}</strong> phiếu
            </span>
            <span style={s.grandTotalAmount}>{fmtMoney(result.grandTotal)} ₫</span>
          </div>

          <div style={s.pagination}>
            <span style={s.pageInfo}>
              {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, result.total)} / {result.total}
            </span>
            <button
              style={s.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              ⟨⟨
            </button>
            <button
              style={s.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              ⟨
            </button>
            <button
              style={s.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              ⟩
            </button>
            <button
              style={s.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              ⟩⟩
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InwardRow({
  row,
  index,
  onView,
  onEdit,
}: {
  row: InwardListItem;
  index: number;
  onView: () => void;
  onEdit: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  const codeStyle =
    VOUCHER_CODE_COLORS[row.voucherCode ?? "DEFAULT"] ??
    VOUCHER_CODE_COLORS.DEFAULT;
  const showQuarantineBadge =
    row.stockBucket === "QUARANTINE" || row.voucherCode === "NK2";

  return (
    <tr
      style={{
        background: hover ? "#f5f3ff" : index % 2 === 0 ? "#fff" : "#fafafa",
        transition: "background 0.12s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onEdit}
    >
      <td style={s.td} onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" />
      </td>
      <td style={{ ...s.td, color: "#64748b", fontSize: 12 }}>
        {row.invoiceNumber ?? "--"}
      </td>
      <td style={{ ...s.td, fontWeight: 700, color: "#6d28d9" }}>
        {row.voucherId}
      </td>
      <td style={s.td}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {row.voucherCode && (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: codeStyle.bg,
                color: codeStyle.color,
                border: `1.5px solid ${codeStyle.border}`,
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
              }}
            >
              {VOUCHER_CODE_LABELS[row.voucherCode] ?? row.voucherCode}
            </span>
          )}
          {showQuarantineBadge && <span style={s.bucketBadge}>Cách ly QC</span>}
        </div>
      </td>
      <td style={{ ...s.td, color: "#64748b" }}>{fmtDate(row.voucherDate)}</td>
      <td style={{ ...s.td, fontWeight: 500 }}>{row.customerName ?? "--"}</td>
      <td
        style={{
          ...s.td,
          textAlign: "right",
          fontWeight: 700,
          color: "#6d28d9",
        }}
      >
        {fmtMoney(row.totalAmount)} ₫
      </td>
      <td
        style={{ ...s.td, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <button style={s.btnView} onClick={onView}>
            👁 Xem
          </button>
          <button style={s.btnEdit} onClick={onEdit}>
            ✏️ Sửa
          </button>
        </div>
      </td>
    </tr>
  );
}

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "0",
    minHeight: "100vh",
    background: "#f8faff",
    fontFamily: FONT,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  heroBanner: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #3b82f6 100%)",
    borderRadius: "14px",
    padding: "24px 28px",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    boxShadow: "0 8px 24px rgba(109,40,217,0.3)",
  },
  heroDecorOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
  },
  heroDecorOrb2: {
    position: "absolute",
    bottom: -30,
    left: 100,
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    marginBottom: 0,
  },
  filterCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  filterBar: {
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  filterLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  filterInput: {
    height: 38,
    padding: "0 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    background: "#fff",
    minWidth: 140,
    color: "#1e293b",
    outline: "none",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 13,
    pointerEvents: "none",
  },
  btnRefresh: {
    height: 38,
    width: 38,
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    background: "#f8faff",
    cursor: "pointer",
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7c3aed",
    marginTop: 22,
    transition: "background 0.15s",
  },
  tableCard: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: 16,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  theadRow: {
    background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: 700,
    color: "#fff",
    borderBottom: "none",
    whiteSpace: "nowrap",
    fontSize: 12,
    letterSpacing: "0.04em",
  },
  td: {
    padding: "11px 16px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    whiteSpace: "nowrap",
    fontSize: 13,
  },
  statusCell: {
    padding: "40px 32px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
  },
  loadingSpinner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    color: "#7c3aed",
    fontWeight: 500,
  },
  spinnerRing: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "3px solid #ede9fe",
    borderTopColor: "#7c3aed",
    animation: "spin 0.75s linear infinite",
  },
  errorBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#fff1f2",
    color: "#b91c1c",
    border: "1.5px solid #fca5a5",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 13,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
    filter: "grayscale(0.5)",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  grandTotal: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  grandTotalAmount: {
    fontSize: 17,
    fontWeight: 800,
    color: "#6d28d9",
    letterSpacing: "-0.3px",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  pageInfo: {
    fontSize: 13,
    color: "#64748b",
    marginRight: 6,
  },
  pageBtn: {
    width: 32,
    height: 32,
    border: "1.5px solid #e2e8f0",
    borderRadius: 7,
    background: "#f8faff",
    cursor: "pointer",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6d28d9",
    fontWeight: 700,
    transition: "all 0.12s",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 22px",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.4)",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s",
    letterSpacing: "0.02em",
  },
  btnView: {
    padding: "5px 14px",
    border: "1.5px solid #bae6fd",
    borderRadius: 7,
    background: "#f0f9ff",
    color: "#0369a1",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.12s",
  },
  btnEdit: {
    padding: "5px 14px",
    border: "1.5px solid #ddd6fe",
    borderRadius: 7,
    background: "#f5f3ff",
    color: "#6d28d9",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.12s",
  },
  bucketBadge: {
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid #fbbf24",
    background: "#fffbeb",
    color: "#b45309",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
  },
};

