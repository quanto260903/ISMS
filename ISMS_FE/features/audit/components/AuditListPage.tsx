// ============================================================
//  features/audit/components/AuditListPage.tsx
// ============================================================

"use client";

import React, { useEffect, useState } from "react";
import { useRouter }    from "next/navigation";
import { useAuditList } from "../hooks/useAuditList";
import { getWarehouses } from "../audit.api";
import type { AuditListDto } from "../types/audit.types";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const AUDIT_TYPE_LABEL: Record<string, string> = {
  FULL:    "Toàn bộ",
  PARTIAL: "Một phần",
};

export default function AuditListPage() {
  const router = useRouter();
  const {
    filters, handleFilterChange, handleSearch, handleRefresh,
    page, setPage, PAGE_SIZE,
    result, loading, error,
  } = useAuditList();

  const [warehouses, setWarehouses] = useState<
    { warehouseId: string; warehouseName: string }[]
  >([]);
  useEffect(() => {
    getWarehouses().then(setWarehouses).catch(console.error);
  }, []);

  const totalPages  = result ? Math.ceil(result.total / PAGE_SIZE) : 1;
  const totalItems  = result?.total ?? 0;
  const totalMatch  = result?.items.reduce((s, r) => s + r.matchCount,   0) ?? 0;
  const totalSurp   = result?.items.reduce((s, r) => s + r.surplusCount, 0) ?? 0;
  const totalDef    = result?.items.reduce((s, r) => s + r.deficitCount, 0) ?? 0;

  return (
    <div style={s.page}>

      {/* ── Hero header ─────────────────────────────────────── */}
      <div style={s.hero}>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Kho hàng</div>
          <h1 style={s.heroTitle}>Phiếu kiểm kê</h1>
        </div>
        <button
          style={{ ...s.btnNew, position: "relative", zIndex: 1 }}
          onClick={() => router.push("/dashboard/audit/new")}
        >
          + Thêm mới
        </button>
      </div>

      {/* ── Summary chips ───────────────────────────────────── */}
      <div style={s.summaryRow}>
        {[
          { label: "Tổng phiếu",  value: totalItems, bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Dòng khớp",   value: totalMatch,  bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
          { label: "Dòng thừa",   value: totalSurp,   bg: "#fefce8", color: "#a16207", border: "#fde68a" },
          { label: "Dòng thiếu",  value: totalDef,    bg: "#fff1f2", color: "#b91c1c", border: "#fca5a5" },
        ].map(({ label, value, bg, color, border }) => (
          <div key={label} style={{ ...s.chip, background: bg, border: `1.5px solid ${border}`, color }}>
            <span style={s.chipValue}>{value.toLocaleString("vi-VN")}</span>
            <span style={s.chipLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Bộ lọc ─────────────────────────────────────────── */}
      <div style={s.filterBar}>

        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Từ ngày</label>
          <input
            type="date" style={s.filterInput}
            value={filters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
          />
        </div>

        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Đến ngày</label>
          <input
            type="date" style={s.filterInput}
            value={filters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
          />
        </div>

        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Kho</label>
          <select
            style={s.filterInput}
            value={filters.warehouseId}
            onChange={(e) => handleFilterChange("warehouseId", e.target.value)}
          >
            <option value="">Tất cả kho</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.warehouseName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...s.filterGroup, flex: 1 }}>
          <label style={s.filterLabel}>Tìm kiếm</label>
          <input
            style={s.filterInput}
            placeholder="Nhập số phiếu, người lập..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <button style={s.btnRefresh} onClick={handleRefresh} title="Làm mới">
          🔄
        </button>
      </div>

      {/* ── Bảng danh sách ─────────────────────────────────── */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Số phiếu KK</th>
              <th style={s.th}>Loại KK</th>
              <th style={s.th}>Kho</th>
              <th style={s.th}>Ngày kiểm kê</th>
              <th style={s.th}>Người lập</th>
              <th style={s.th}>Diễn giải</th>
              <th style={{ ...s.th, textAlign: "center" }}>Tổng dòng</th>
              <th style={{ ...s.th, textAlign: "center" }}>Khớp</th>
              <th style={{ ...s.th, textAlign: "center" }}>Thừa</th>
              <th style={{ ...s.th, textAlign: "center" }}>Thiếu</th>
              <th style={{ ...s.th, textAlign: "center" }}>Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} style={s.statusCell}>
                  <div style={s.loadingDot}>
                    <span /><span /><span />
                  </div>
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={11} style={{ ...s.statusCell, color: "#b91c1c" }}>
                  ⚠️ {error}
                </td>
              </tr>
            )}
            {!loading && !error && result?.items.length === 0 && (
              <tr>
                <td colSpan={11} style={s.statusCell}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  Không có phiếu kiểm kê nào
                </td>
              </tr>
            )}
            {!loading && result?.items.map((row, i) => (
              <AuditRow
                key={row.voucherId}
                row={row}
                i={i}
                warehouseName={
                  warehouses.find((w) => w.warehouseId === row.warehouseId)
                    ?.warehouseName ?? row.warehouseId ?? "—"
                }
                onEdit={() => router.push(`/dashboard/audit/${row.voucherId}`)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer phân trang ───────────────────────────────── */}
      {result && result.total > 0 && (
        <div style={s.footer}>
          <span style={s.totalText}>
            Tổng số: <strong>{result.total}</strong> phiếu
          </span>
          <div style={s.pagination}>
            <span style={s.pageInfo}>
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, result.total)} / {result.total}
            </span>
            <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(1)}>⟪</button>
            <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(page - 1)}>‹</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟫</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Row component ──────────────────────────────────────────── */
function AuditRow({
  row, i, warehouseName, onEdit,
}: {
  row:           AuditListDto;
  i:             number;
  warehouseName: string;
  onEdit:        () => void;
}) {
  const [hover, setHover] = React.useState(false);

  const auditTypeLabel = AUDIT_TYPE_LABEL[row.auditType ?? ""] ?? row.auditType ?? "—";
  const isPartial      = row.auditType === "PARTIAL";

  return (
    <tr
      style={{
        background:  hover ? "#f0f4ff" : i % 2 === 0 ? "#fff" : "#fafbff",
        transition:  "background 0.12s",
        cursor:      "pointer",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onEdit}
    >
      {/* Số phiếu */}
      <td style={{ ...s.td, fontWeight: 700, color: "#1d4ed8" }}>
        {row.voucherId}
      </td>

      {/* Loại KK */}
      <td style={s.td}>
        <span style={{
          display: "inline-block",
          padding: "2px 10px", borderRadius: 20,
          fontSize: 11, fontWeight: 700,
          background: isPartial ? "#eff6ff" : "#f0fdf4",
          color:      isPartial ? "#1d4ed8" : "#15803d",
          border:     `1px solid ${isPartial ? "#bfdbfe" : "#bbf7d0"}`,
          whiteSpace: "nowrap" as const,
        }}>
          {auditTypeLabel}
        </span>
      </td>

      {/* Kho */}
      <td style={{ ...s.td, color: "#475569" }}>{warehouseName}</td>

      {/* Ngày */}
      <td style={{ ...s.td, color: "#475569" }}>{fmtDate(row.auditDate)}</td>

      {/* Người lập */}
      <td style={s.td}>{row.createdBy ?? "—"}</td>

      {/* Diễn giải */}
      <td style={{ ...s.td, color: "#64748b", maxWidth: 200,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
        {row.description || "—"}
      </td>

      {/* Tổng dòng */}
      <td style={{ ...s.td, textAlign: "center", fontWeight: 600 }}>
        {row.itemCount}
      </td>

      {/* Khớp */}
      <td style={{ ...s.td, textAlign: "center" }}>
        {row.matchCount > 0 ? (
          <span style={s.badgeMatch}>{row.matchCount}</span>
        ) : <span style={s.badgeZero}>—</span>}
      </td>

      {/* Thừa */}
      <td style={{ ...s.td, textAlign: "center" }}>
        {row.surplusCount > 0 ? (
          <span style={s.badgeSurplus}>{row.surplusCount}</span>
        ) : <span style={s.badgeZero}>—</span>}
      </td>

      {/* Thiếu */}
      <td style={{ ...s.td, textAlign: "center" }}>
        {row.deficitCount > 0 ? (
          <span style={s.badgeDeficit}>{row.deficitCount}</span>
        ) : <span style={s.badgeZero}>—</span>}
      </td>

      {/* Chức năng */}
      <td style={{ ...s.td, textAlign: "center" }}
          onClick={(e) => e.stopPropagation()}>
        <button style={s.btnEdit} onClick={onEdit}>✏️ Sửa</button>
      </td>
    </tr>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px 28px", minHeight: "100vh",
    background: "#f8f9ff", fontFamily: "sans-serif",
  },

  // Hero
  hero: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)",
    borderRadius: 14, padding: "22px 28px", marginBottom: 16,
    boxShadow: "0 8px 24px rgba(29,78,216,0.28)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  heroOrb1: {
    position: "absolute", top: -40, right: 160, width: 160, height: 160,
    borderRadius: "50%", background: "rgba(255,255,255,0.06)",
  },
  heroOrb2: {
    position: "absolute", bottom: -30, left: 60, width: 110, height: 110,
    borderRadius: "50%", background: "rgba(255,255,255,0.04)",
  },
  heroEyebrow: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  btnNew: {
    height: 38, padding: "0 22px", borderRadius: 9,
    border: "2px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.15)",
    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
    backdropFilter: "blur(4px)",
  },

  // Summary chips
  summaryRow: { display: "flex", gap: 12, marginBottom: 16 },
  chip: {
    display: "flex", flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center",
    gap: 3, padding: "12px 20px", borderRadius: 10, minWidth: 100,
  },
  chipValue: { fontSize: 22, fontWeight: 800 },
  chipLabel: { fontSize: 11, fontWeight: 600 },

  // Filter bar
  filterBar: {
    display: "flex", gap: 12, alignItems: "flex-end",
    marginBottom: 14, flexWrap: "wrap" as const,
    background: "#fff", padding: "14px 16px",
    borderRadius: 10, border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  filterGroup:  { display: "flex", flexDirection: "column" as const, gap: 4 },
  filterLabel:  { fontSize: 11, color: "#64748b", fontWeight: 600 },
  filterInput: {
    height: 36, padding: "0 10px",
    border: "1.5px solid #e2e8f0", borderRadius: 7,
    fontSize: 13, background: "#fff", minWidth: 140,
    outline: "none",
  },
  btnRefresh: {
    height: 36, width: 36, border: "1.5px solid #e2e8f0",
    borderRadius: 7, background: "#fff", cursor: "pointer",
    fontSize: 16, alignSelf: "flex-end",
  },

  // Table
  tableCard: {
    overflowX: "auto" as const, background: "#fff",
    borderRadius: 10, border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 14,
  },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    padding: "11px 14px",
    background: "linear-gradient(180deg,#1e40af,#1d4ed8)",
    color: "#fff", textAlign: "left" as const,
    fontWeight: 600, fontSize: 11,
    whiteSpace: "nowrap" as const, letterSpacing: "0.04em",
    borderBottom: "2px solid #1e3a8a",
  },
  td: {
    padding: "10px 14px", borderBottom: "1px solid #f1f5f9",
    color: "#1e293b", fontSize: 13,
  },
  statusCell: {
    padding: "48px 0", textAlign: "center" as const,
    color: "#94a3b8", fontSize: 14,
  },
  loadingDot: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 8 },

  // Badges
  badgeMatch: {
    display: "inline-block", padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0",
  },
  badgeSurplus: {
    display: "inline-block", padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    background: "#fefce8", color: "#a16207", border: "1px solid #fde68a",
  },
  badgeDeficit: {
    display: "inline-block", padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    background: "#fff1f2", color: "#b91c1c", border: "1px solid #fca5a5",
  },
  badgeZero: { color: "#cbd5e1", fontSize: 12 },

  // Footer
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", background: "#fff",
    borderRadius: 10, border: "1px solid #e2e8f0",
  },
  totalText: { fontSize: 13, color: "#64748b" },
  pagination: { display: "flex", alignItems: "center", gap: 6 },
  pageInfo:   { fontSize: 13, color: "#64748b", marginRight: 6 },
  pageBtn: {
    width: 30, height: 30, border: "1.5px solid #e2e8f0",
    borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14,
  },
  btnEdit: {
    padding: "4px 12px", border: "1px solid #bfdbfe",
    borderRadius: 6, background: "#eff6ff",
    color: "#1d4ed8", fontWeight: 600, fontSize: 12, cursor: "pointer",
  },
};