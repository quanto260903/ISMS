// ============================================================
//  features/activity-log/components/ActivityLogPage.tsx
//  Nhật ký hoạt động hệ thống — dành cho Manager & Admin
// ============================================================

"use client";

import React from "react";
import { useActivityLog } from "../hooks/useActivityLog";
import {
  MODULE_OPTIONS, MODULE_COLORS, MODULE_LABELS, ACTION_LABELS,
} from "../types/activityLog.types";
import type { ActivityLogItem } from "../types/activityLog.types";

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

const fmtDateTime = (d: string | null) => {
  if (!d) return "--";
  const dt = new Date(d);
  return dt.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

export default function ActivityLogPage() {
  const {
    filters, handleFilterChange, handleRefresh,
    page, setPage, PAGE_SIZE,
    result, loading, error,
  } = useActivityLog();

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  return (
    <div style={s.page}>

      {/* ── Hero header ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb1} />
        <div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>WMS Pro · Quản lý hệ thống</div>
          <h1 style={s.heroTitle}>Nhật ký hoạt động</h1>
          <p style={s.heroSub}>Theo dõi toàn bộ hoạt động thay đổi dữ liệu trong hệ thống</p>
        </div>
        <div style={s.heroBadge}>
          <span style={{ fontSize: 20 }}>📋</span>
          {result && (
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              {result.total.toLocaleString("vi-VN")} bản ghi
            </span>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={s.filterCard}>
        <div style={s.filterBar}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Module</label>
            <select
              style={s.filterSelect}
              value={filters.module}
              onChange={(e) => handleFilterChange("module", e.target.value)}
            >
              {MODULE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Từ ngày</label>
            <input type="date" style={s.filterInput}
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            />
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Đến ngày</label>
            <input type="date" style={s.filterInput}
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
                placeholder="Tìm theo nội dung, người dùng..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
              />
            </div>
          </div>
          <button style={s.btnRefresh} onClick={handleRefresh} title="Làm mới">
            <span style={{ fontSize: 16 }}>↺</span>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={s.tableCard}>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>#</th>
                <th style={s.th}>Thời gian</th>
                <th style={s.th}>Người thực hiện</th>
                <th style={s.th}>Module</th>
                <th style={s.th}>Hành động</th>
                <th style={{ ...s.th, minWidth: 320 }}>Nội dung</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={s.statusCell}>
                    <div style={s.loadingWrap}>
                      <div style={s.spinner} />
                      <span>Đang tải nhật ký...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} style={s.statusCell}>
                    <div style={s.errorBox}>⚠️ {error}</div>
                  </td>
                </tr>
              )}
              {!loading && !error && result?.items.length === 0 && (
                <tr>
                  <td colSpan={6} style={s.statusCell}>
                    <div style={s.emptyState}>
                      <div style={{ fontSize: 36, marginBottom: 6 }}>📭</div>
                      <p style={{ fontWeight: 600, color: "#374151" }}>Không có nhật ký nào</p>
                      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                        Thử thay đổi bộ lọc để tìm kiếm
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && result?.items.map((row, i) => (
                <LogRow key={row.id} row={row} index={(page - 1) * PAGE_SIZE + i + 1} i={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {result && result.total > 0 && (
        <div style={s.footer}>
          <span style={{ color: "#64748b", fontSize: 13 }}>
            Hiển thị{" "}
            <strong style={{ color: "#1e293b" }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, result.total)}
            </strong>
            {" "}/ {result.total} bản ghi
          </span>
          <div style={s.pagination}>
            <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage(1)}>⟨⟨</button>
            <button style={s.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>⟨</button>
            <span style={s.pageNum}>{page} / {totalPages}</span>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>⟩</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟩⟩</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Row ──────────────────────────────────────────────────────
function LogRow({ row, index, i }: { row: ActivityLogItem; index: number; i: number }) {
  const mod    = row.module ?? "DEFAULT";
  const color  = MODULE_COLORS[mod] ?? MODULE_COLORS.DEFAULT;
  const label  = MODULE_LABELS[mod] ?? mod;
  const action = ACTION_LABELS[row.action ?? ""] ?? row.action ?? "--";

  return (
    <tr style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
      <td style={{ ...s.td, color: "#94a3b8", width: 40, textAlign: "center" }}>{index}</td>
      <td style={{ ...s.td, color: "#64748b", whiteSpace: "nowrap", fontSize: 12 }}>
        {fmtDateTime(row.createdAt)}
      </td>
      <td style={s.td}>
        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
          {row.userFullName ?? "--"}
        </div>
        {row.userId && (
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.userId}</div>
        )}
      </td>
      <td style={s.td}>
        <span style={{
          display: "inline-block", padding: "3px 10px", borderRadius: 20,
          fontSize: 11, fontWeight: 700,
          background: color.bg, color: color.color,
          border: `1.5px solid ${color.border}`,
          whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      </td>
      <td style={s.td}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{action}</span>
      </td>
      <td style={{ ...s.td, maxWidth: 400, whiteSpace: "normal", lineHeight: 1.5 }}>
        {row.description ?? "--"}
      </td>
    </tr>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:       { padding: 0, minHeight: "100vh", background: "#f8faff", fontFamily: FONT, display: "flex", flexDirection: "column", gap: 0 },
  heroBanner: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 60%, #2563eb 100%)", borderRadius: 14, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 8px 24px rgba(30,64,175,0.3)" },
  heroOrb1:   { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2:   { position: "absolute", bottom: -30, left: 100, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow:{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle:  { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.3px" },
  heroSub:    { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4, marginBottom: 0 },
  heroBadge:  { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", flexShrink: 0 },
  filterCard: { background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  filterBar:  { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },
  filterGroup:{ display: "flex", flexDirection: "column" as const, gap: 5 },
  filterLabel:{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" },
  filterInput:{ height: 38, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", minWidth: 140, color: "#1e293b", outline: "none" },
  filterSelect:{ height: 38, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", minWidth: 150, color: "#1e293b", outline: "none", cursor: "pointer" },
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, pointerEvents: "none" },
  btnRefresh: { height: 38, width: 38, border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#eff6ff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8", marginTop: 22 },
  tableCard:  { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 16 },
  table:      { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  theadRow:   { background: "linear-gradient(135deg, #1e3a5f, #1e40af)" },
  th:         { padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" as const, fontSize: 12, letterSpacing: "0.04em" },
  td:         { padding: "11px 16px", borderBottom: "1px solid #f1f5f9", color: "#334155", whiteSpace: "nowrap" as const },
  statusCell: { padding: "40px 32px", textAlign: "center" as const },
  loadingWrap:{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12, color: "#1d4ed8", fontWeight: 500 },
  spinner:    { width: 36, height: 36, borderRadius: "50%", border: "3px solid #dbeafe", borderTopColor: "#1d4ed8" },
  errorBox:   { display: "inline-flex", alignItems: "center", gap: 8, background: "#fff1f2", color: "#b91c1c", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "10px 18px", fontWeight: 600 },
  emptyState: { display: "flex", flexDirection: "column" as const, alignItems: "center" },
  footer:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  pagination: { display: "flex", alignItems: "center", gap: 6 },
  pageBtn:    { width: 32, height: 32, border: "1.5px solid #e2e8f0", borderRadius: 7, background: "#eff6ff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8", fontWeight: 700 },
  pageNum:    { fontSize: 13, color: "#64748b", padding: "0 8px" },
};
