// features/inventory-report/components/InventoryReportPage.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { getInventorySummary } from "../inventoryReport.api";
import type {
  InventorySummaryDto,
  InventorySummaryGroupDto,
  InventorySummaryItemDto,
} from "../types/inventoryReport.types";

// ── Helpers ────────────────────────────────────────────────────
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
const today = () => new Date().toISOString().split("T")[0];

const fmtDate = (s: string) =>
  new Date(s + "T00:00:00").toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtNum = (n: number) =>
  n === 0 ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

// ── CSV Export ─────────────────────────────────────────────────
function exportCsv(report: InventorySummaryDto) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel
  const rows: string[] = [
    `SỔ TỔNG HỢP TỒN KHO`,
    `Kỳ báo cáo: ${fmtDate(report.fromDate)} - ${fmtDate(report.toDate)}`,
    `Xuất lúc: ${fmtDateTime(report.generatedAt)}`,
    ``,
    `Mã hàng,Tên hàng hóa,Đơn vị,Đầu kỳ,Nhập kỳ,Xuất kỳ,Cuối kỳ`,
  ];

  for (const group of report.groups) {
    rows.push(`"[${group.groupName}]",,,${group.subOpening},${group.subInbound},${group.subOutbound},${group.subClosing}`);
    for (const item of group.items) {
      rows.push(`"${item.goodsId}","${item.goodsName}","${item.unit}",${item.opening},${item.inbound},${item.outbound},${item.closing}`);
    }
  }

  const { totals: t } = report;
  rows.push(`TỔNG CỘNG,,,${t.totalOpening},${t.totalInbound},${t.totalOutbound},${t.totalClosing}`);

  const blob = new Blob([BOM + rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `TonKho_${report.fromDate}_${report.toDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Flat row types for pagination ─────────────────────────────
type FlatRow =
  | { kind: "group"; group: InventorySummaryGroupDto }
  | { kind: "item";  item: InventorySummaryItemDto; groupId: string | null };

// ── Column header ──────────────────────────────────────────────
const COL_WIDTHS = {
  stt:  44,
  code: 120,
  name: null,   // flex
  unit:  70,
  open:  100,
  in:    100,
  out:   100,
  close: 100,
};

function Th({ children, align = "right", w }: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  w?: number | null;
}) {
  return (
    <th style={{
      padding: "10px 12px",
      textAlign: align,
      fontWeight: 600,
      fontSize: 11,
      whiteSpace: "nowrap",
      width: w ?? undefined,
      letterSpacing: ".03em",
      position: "sticky",
      top: 0,
      background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
      color: "#fff",
      zIndex: 2,
    }}>
      {children}
    </th>
  );
}

// ── Main Component ─────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50, 100];

export default function InventoryReportPage() {
  const [fromDate,     setFromDate]     = useState(firstOfMonth());
  const [toDate,       setToDate]       = useState(today());
  const [keyword,      setKeyword]      = useState("");
  const [showFilter,   setShowFilter]   = useState(false);
  const [report,       setReport]       = useState<InventorySummaryDto | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set());
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(25);

  // ── Toggle expand/collapse group ────────────────────────────
  const toggleGroup = useCallback((gid: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next;
    });
    setPage(1);
  }, []);

  const expandAll = useCallback(() => {
    if (!report) return;
    setExpanded(new Set(report.groups.map(g => g.groupId ?? "__no_group__")));
    setPage(1);
  }, [report]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
    setPage(1);
  }, []);

  // ── Flat rows (group headers + visible items) ────────────────
  const flatRows = useMemo<FlatRow[]>(() => {
    if (!report) return [];
    const rows: FlatRow[] = [];
    for (const group of report.groups) {
      const gid = group.groupId ?? "__no_group__";
      rows.push({ kind: "group", group });
      if (expanded.has(gid)) {
        for (const item of group.items) {
          rows.push({ kind: "item", item, groupId: group.groupId });
        }
      }
    }
    return rows;
  }, [report, expanded]);

  const totalPages = Math.max(1, Math.ceil(flatRows.length / pageSize));
  const pageRows   = flatRows.slice((page - 1) * pageSize, page * pageSize);

  // visible items count (for "total records" display)
  const visibleItemCount = flatRows.filter(r => r.kind === "item").length;

  // ── Fetch ───────────────────────────────────────────────────
  const handleLoad = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const data = await getInventorySummary({ fromDate, toDate, keyword: keyword || undefined });
      setReport(data);
      // Expand all groups by default
      setExpanded(new Set(data.groups.map(g => g.groupId ?? "__no_group__")));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => handleLoad();

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#1e293b" }}>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #inv-print, #inv-print * { visibility: visible; }
          #inv-print { position: absolute; inset: 0; padding: 16px; }
          .no-print { display: none !important; }
        }
        .hover-row:hover { background: #f5f3ff !important; }
      `}</style>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-.01em" }}>
          INVENTORY SUMMARY
        </h1>
        {report ? (
          <p style={{ fontSize: 13, color: "#6d28d9", margin: "4px 0 0", fontWeight: 500 }}>
            Kỳ báo cáo: {fmtDate(report.fromDate)} — {fmtDate(report.toDate)}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
            Sổ tổng hợp tồn kho theo kỳ
          </p>
        )}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setShowFilter(f => !f)}
          style={btnStyle(showFilter)}
        >
          🔧 Filter Parameters
        </button>

        <button onClick={handleLoad} disabled={loading} style={btnStyle(false, true)}>
          {loading ? "⏳ Đang tải..." : "📊 Xem báo cáo"}
        </button>

        {report && (
          <>
            <button onClick={handleRefresh} disabled={loading} style={btnStyle(false)}>
              🔄 Refresh
            </button>
            <button onClick={() => exportCsv(report)} style={btnStyle(false)}>
              📥 Export Excel
            </button>
            <button onClick={() => window.print()} style={btnStyle(false)}>
              🖨 In
            </button>
          </>
        )}

        {report && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={expandAll}   style={smallBtn}>Mở tất cả</button>
            <button onClick={collapseAll} style={smallBtn}>Đóng tất cả</button>
          </div>
        )}
      </div>

      {/* ── Filter Panel ─────────────────────────────────────── */}
      {showFilter && (
        <div
          className="no-print"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 14,
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "flex-end",
          }}
        >
          <Field label="Từ ngày">
            <input
              type="date" value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Đến ngày">
            <input
              type="date" value={toDate}
              max={today()}
              onChange={e => setToDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Từ khóa (mã / tên hàng)">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLoad()}
              style={{ ...inputStyle, width: 200 }}
            />
          </Field>
          <button onClick={handleLoad} disabled={loading} style={btnStyle(false, true)}>
            Áp dụng
          </button>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div style={errorBox}>{error}</div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!report && !loading && !error && (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 14, margin: 0 }}>
            Chọn khoảng thời gian và nhấn{" "}
            <strong style={{ color: "#6d28d9" }}>Xem báo cáo</strong>.
          </p>
        </div>
      )}

      {/* ── Report ─────────────────────────────────────────────── */}
      {report && (
        <div id="inv-print">
          {/* Print header (screen: hidden) */}
          <div style={{ display: "none" }} className="print-header">
            <style>{`@media print { .print-header { display: block !important; text-align: center; margin-bottom: 12px; } }`}</style>
            <h2 style={{ margin: 0 }}>SỔ TỔNG HỢP TỒN KHO</h2>
            <p>Kỳ: {fmtDate(report.fromDate)} — {fmtDate(report.toDate)} | Xuất: {fmtDateTime(report.generatedAt)}</p>
          </div>

          {/* Summary strip */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 10,
            marginBottom: 14,
          }}>
            {[
              { label: "Tổng mặt hàng",  value: report.totals.totalItems,    color: "#6d28d9" },
              { label: "Tồn đầu kỳ",     value: fmtNum(report.totals.totalOpening),  color: "#0ea5e9", raw: true },
              { label: "Nhập trong kỳ",  value: fmtNum(report.totals.totalInbound),  color: "#10b981", raw: true },
              { label: "Xuất trong kỳ",  value: fmtNum(report.totals.totalOutbound), color: "#f59e0b", raw: true },
              { label: "Tồn cuối kỳ",    value: fmtNum(report.totals.totalClosing),  color: "#8b5cf6", raw: true },
            ].map(c => (
              <div key={c.label} style={{
                background: "#fff",
                borderLeft: `3px solid ${c.color}`,
                borderRadius: 8,
                padding: "10px 14px",
                boxShadow: "0 1px 3px rgba(0,0,0,.07)",
              }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.color, marginTop: 2 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="no-print" style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 8, flexWrap: "wrap", gap: 8,
          }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {visibleItemCount} mặt hàng hiển thị · {report.totals.totalItems} tổng cộng ·{" "}
              trang {page}/{totalPages}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, color: "#64748b" }}>Dòng/trang:</label>
              <select
                value={pageSize}
                onChange={e => { setPageSize(+e.target.value); setPage(1); }}
                style={{ ...inputStyle, width: 72, padding: "0 6px" }}
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto", maxHeight: 600, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <Th align="center" w={COL_WIDTHS.stt}>STT</Th>
                    <Th align="left"   w={COL_WIDTHS.code}>Mã hàng</Th>
                    <Th align="left"   w={COL_WIDTHS.name}>Tên hàng hóa</Th>
                    <Th align="center" w={COL_WIDTHS.unit}>ĐVT</Th>
                    <Th align="right"  w={COL_WIDTHS.open}>Đầu kỳ</Th>
                    <Th align="right"  w={COL_WIDTHS.in}>Nhập kỳ</Th>
                    <Th align="right"  w={COL_WIDTHS.out}>Xuất kỳ</Th>
                    <Th align="right"  w={COL_WIDTHS.close}>Cuối kỳ</Th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row, idx) => {
                      if (row.kind === "group") {
                        const g   = row.group;
                        const gid = g.groupId ?? "__no_group__";
                        const open = expanded.has(gid);
                        return (
                          <GroupRow
                            key={`g-${gid}`}
                            group={g}
                            isExpanded={open}
                            onToggle={() => toggleGroup(gid)}
                          />
                        );
                      }
                      // item row
                      const item = row.item;
                      const itemNum = flatRows
                        .filter(r => r.kind === "item")
                        .indexOf(row) + 1;
                      return (
                        <ItemRow
                          key={`i-${item.goodsId}`}
                          item={item}
                          rowNum={itemNum}
                          isEven={idx % 2 === 0}
                        />
                      );
                    })
                  )}
                </tbody>

                {/* Total footer */}
                {report && (
                  <tfoot>
                    <tr style={{
                      background: "#f1f5f9",
                      borderTop: "2px solid #6d28d9",
                      fontWeight: 700,
                    }}>
                      <td colSpan={4} style={{ ...td, color: "#6d28d9", fontSize: 13 }}>
                        TỔNG CỘNG ({report.totals.totalItems} mặt hàng)
                      </td>
                      <td style={{ ...td, textAlign: "right", color: "#1e293b" }}>
                        {fmtNum(report.totals.totalOpening)}
                      </td>
                      <td style={{ ...td, textAlign: "right", color: "#10b981" }}>
                        {fmtNum(report.totals.totalInbound)}
                      </td>
                      <td style={{ ...td, textAlign: "right", color: "#f59e0b" }}>
                        {fmtNum(report.totals.totalOutbound)}
                      </td>
                      <td style={{ ...td, textAlign: "right", color: "#6d28d9" }}>
                        {fmtNum(report.totals.totalClosing)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination bar */}
            {totalPages > 1 && (
              <div className="no-print" style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                gap: 4, padding: "10px 16px", borderTop: "1px solid #f1f5f9",
              }}>
                <PagBtn onClick={() => setPage(1)} disabled={page === 1}>«</PagBtn>
                <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</PagBtn>
                {pageRange(page, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} style={{ color: "#94a3b8", padding: "0 2px" }}>…</span>
                  ) : (
                    <PagBtn key={p} onClick={() => setPage(p as number)} active={page === p as number}>
                      {p}
                    </PagBtn>
                  )
                )}
                <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</PagBtn>
                <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</PagBtn>
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 8 }}>
            Xuất lúc: {fmtDateTime(report.generatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function GroupRow({
  group, isExpanded, onToggle,
}: {
  group: InventorySummaryGroupDto;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <tr
      onClick={onToggle}
      style={{
        background: isExpanded ? "#ede9fe" : "#f5f3ff",
        cursor: "pointer",
        borderBottom: "1px solid #ddd6fe",
        userSelect: "none",
      }}
    >
      <td style={{ ...td, textAlign: "center", color: "#6d28d9", fontWeight: 700 }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20, height: 20,
          borderRadius: 4,
          background: "#6d28d9",
          color: "#fff",
          fontSize: 10,
          transition: "transform .15s",
          transform: isExpanded ? "rotate(90deg)" : "none",
        }}>▶</span>
      </td>
      <td colSpan={3} style={{ ...td, fontWeight: 700, color: "#4c1d95", fontSize: 13 }}>
        {group.groupName}
        <span style={{ marginLeft: 8, fontSize: 11, color: "#7c3aed", fontWeight: 400 }}>
          ({group.items.length} mặt hàng)
        </span>
      </td>
      <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#4c1d95" }}>{fmtNum(group.subOpening)}</td>
      <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#065f46" }}>{fmtNum(group.subInbound)}</td>
      <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#92400e" }}>{fmtNum(group.subOutbound)}</td>
      <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#4c1d95" }}>{fmtNum(group.subClosing)}</td>
    </tr>
  );
}

function ItemRow({
  item, rowNum, isEven,
}: {
  item: InventorySummaryItemDto;
  rowNum: number;
  isEven: boolean;
}) {
  return (
    <tr
      className="hover-row"
      style={{
        background: isEven ? "#fff" : "#fafafa",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <td style={{ ...td, textAlign: "center", color: "#cbd5e1", fontSize: 11 }}>{rowNum}</td>
      <td style={{ ...td, fontFamily: "monospace", color: "#6d28d9", fontSize: 12, paddingLeft: 24 }}>
        {item.goodsId}
      </td>
      <td style={{ ...td, paddingLeft: 24 }}>{item.goodsName}</td>
      <td style={{ ...td, textAlign: "center", color: "#475569" }}>{item.unit}</td>
      <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtNum(item.opening)}</td>
      <td style={{ ...td, textAlign: "right", color: "#059669", fontVariantNumeric: "tabular-nums" }}>{fmtNum(item.inbound)}</td>
      <td style={{ ...td, textAlign: "right", color: "#d97706", fontVariantNumeric: "tabular-nums" }}>{fmtNum(item.outbound)}</td>
      <td style={{ ...td, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums",
        color: item.closing < 0 ? "#dc2626" : "#1e293b" }}>
        {fmtNum(item.closing)}
      </td>
    </tr>
  );
}

function PagBtn({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 28, height: 28,
        border: active ? "2px solid #6d28d9" : "1px solid #e2e8f0",
        borderRadius: 5,
        background: active ? "#6d28d9" : "#fff",
        color: active ? "#fff" : disabled ? "#cbd5e1" : "#475569",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 12,
        fontWeight: active ? 700 : 400,
        padding: "0 6px",
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b",
        textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
      {children}
    </div>
  );
}

function pageRange(current: number, total: number): (number | "...")[] {
  const delta = 2;
  const range: number[] = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++)
    range.push(i);
  const result: (number | "...")[] = [];
  if (range[0] > 1) { result.push(1); if (range[0] > 2) result.push("..."); }
  result.push(...range);
  const last = range[range.length - 1];
  if (last < total) { if (last < total - 1) result.push("..."); result.push(total); }
  return result;
}

// ── Shared styles ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  height: 34,
  padding: "0 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 7,
  fontSize: 13,
  outline: "none",
  background: "#f8fafc",
  color: "#1e293b",
  width: "100%",
};

const td: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  verticalAlign: "middle",
};

const errorBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#b91c1c",
  borderRadius: 8,
  padding: "10px 16px",
  marginBottom: 14,
  fontSize: 13,
};

function btnStyle(active: boolean, primary = false): React.CSSProperties {
  return {
    padding: "7px 14px",
    background: primary
      ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
      : active ? "#ede9fe" : "#f8fafc",
    color: primary ? "#fff" : active ? "#6d28d9" : "#475569",
    border: `1px solid ${primary ? "transparent" : active ? "#c4b5fd" : "#e2e8f0"}`,
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };
}

const smallBtn: React.CSSProperties = {
  padding: "4px 10px",
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 11,
  color: "#475569",
  cursor: "pointer",
};
