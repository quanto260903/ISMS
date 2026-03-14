// features/stock-take/components/StockTakeListPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStockTakeList, deleteStockTake } from "../stockTake.api";
import type { StockTakeListDto } from "../types/stockTake.types";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function StockTakeListPage() {
  const router    = useRouter();
  const PAGE_SIZE = 20;

  const [rows,       setRows]       = useState<StockTakeListDto[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [keyword,    setKeyword]    = useState("");
  const [filterDone, setFilterDone] = useState<boolean | "">("");
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async (kw: string, done: boolean | "", p: number) => {
    setLoading(true);
    try {
      const res = await getStockTakeList({ keyword: kw || undefined, isCompleted: done, page: p, pageSize: PAGE_SIZE });
      setRows(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tải dữ liệu", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(keyword, filterDone, page); }, [page]); // eslint-disable-line

  const handleDelete = async (row: StockTakeListDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xóa phiếu "${row.voucherCode}"?`)) return;
    try {
      await deleteStockTake(row.stockTakeVoucherId);
      showToast("Đã xóa phiếu");
      fetchData(keyword, filterDone, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi xóa", false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const TABS = [
    { label: "Tất cả",     value: ""    as const },
    { label: "Đang kiểm",  value: false as const },
    { label: "Hoàn thành", value: true  as const },
  ];

  return (
    <div style={s.page}>
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#f0fdf4" : "#fff1f2",
          color: toast.ok ? "#15803d" : "#b91c1c", border: `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}` }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Kiểm kê kho</h1>
          <p style={s.pageSub}>Quản lý phiếu kiểm kê, đối chiếu tồn sách và thực tế</p>
        </div>
        {/* Nút THÊM MỚI → điều hướng sang trang tạo phiếu */}
        <button style={s.btnPrimary} onClick={() => router.push("/dashboard/stock-take/create")}>
          + Thêm mới
        </button>
      </div>

      {/* ── Tabs trạng thái ── */}
      <div style={s.tabs}>
        {TABS.map((tab) => (
          <button key={String(tab.value)}
            style={{ ...s.tab, ...(filterDone === tab.value ? s.tabActive : {}) }}
            onClick={() => { setFilterDone(tab.value); setPage(1); fetchData(keyword, tab.value, 1); }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={s.toolbar}>
        <div style={s.searchBox}>
          <span style={{ position: "absolute", left: 10, color: "#94a3b8", fontSize: 13 }}>🔍</span>
          <input style={s.searchInput}
            placeholder="Tìm mã phiếu, mục đích..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchData(keyword, filterDone, 1); } }}
          />
        </div>
        <button style={s.iconBtn} onClick={() => fetchData(keyword, filterDone, page)} title="Làm mới">🔄</button>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 120, textAlign: "left"   }}>Số phiếu KK</th>
              <th style={{ ...s.th, width: 110, textAlign: "left"   }}>Ngày lập</th>
              <th style={{ ...s.th, width: 110, textAlign: "left"   }}>Ngày kiểm</th>
              <th style={{ ...s.th,             textAlign: "left"   }}>Mục đích</th>
              <th style={{ ...s.th, width: 140, textAlign: "left"   }}>Người lập phiếu</th>
              <th style={{ ...s.th, width: 80,  textAlign: "right"  }}>Thừa</th>
              <th style={{ ...s.th, width: 80,  textAlign: "right"  }}>Thiếu</th>
              <th style={{ ...s.th, width: 120, textAlign: "center" }}>Trạng thái</th>
              <th style={{ ...s.th, width: 44                       }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={s.emptyCell}>
                <div style={s.spinner} /><div style={{ marginTop: 8, color: "#94a3b8" }}>Đang tải...</div>
              </td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} style={s.emptyCell}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ color: "#64748b", marginBottom: 12 }}>Chưa có phiếu kiểm kê nào</div>
                <button style={s.btnPrimary} onClick={() => router.push("/dashboard/stock-take/create")}>
                  + Thêm mới
                </button>
              </td></tr>
            )}
            {!loading && rows.map((row, i) => (
              <tr key={row.stockTakeVoucherId}
                style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#fafbff" }}
                onClick={() => router.push(`/dashboard/stock-take/${row.stockTakeVoucherId}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbff")}
              >
                <td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>
                  {row.voucherCode}
                </td>
                <td style={{ ...s.td, fontSize: 12, color: "#475569" }}>{fmtDate(row.voucherDate)}</td>
                <td style={{ ...s.td, fontSize: 12, color: "#475569" }}>{fmtDate(row.stockTakeDate)}</td>
                <td style={{ ...s.td, color: "#64748b" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                    {row.purpose || "--"}
                  </div>
                </td>
                <td style={{ ...s.td, fontSize: 12, color: "#475569" }}>{row.createdBy || "--"}</td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                  color: row.totalSurplus > 0 ? "#16a34a" : "#94a3b8" }}>
                  {row.totalSurplus > 0 ? `+${row.totalSurplus.toLocaleString("vi-VN")}` : "--"}
                </td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                  color: row.totalShortage > 0 ? "#dc2626" : "#94a3b8" }}>
                  {row.totalShortage > 0 ? `-${row.totalShortage.toLocaleString("vi-VN")}` : "--"}
                </td>
                <td style={{ ...s.td, textAlign: "center" }}>
                  <span style={{
                    display: "inline-block", padding: "2px 10px", borderRadius: 20,
                    fontSize: 11, fontWeight: 700,
                    background: row.isCompleted ? "#f0fdf4" : "#fffbeb",
                    color:      row.isCompleted ? "#15803d" : "#d97706",
                    border:     `1px solid ${row.isCompleted ? "#bbf7d0" : "#fde68a"}`,
                  }}>
                    {row.isCompleted ? "✓ Hoàn thành" : "◑ Đang kiểm"}
                  </span>
                </td>
                <td style={{ ...s.td, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                  {!row.isCompleted && (
                    <button style={s.delBtn} title="Xóa" onClick={(e) => handleDelete(row, e)}>🗑</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={s.footer}>
        <span style={{ fontSize: 13, color: "#475569" }}>Tổng: <strong>{total}</strong> phiếu</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {total === 0 ? "0" : `${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE, total)}`}
          </span>
          <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(1)}>⟪</button>
          <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(p => p-1)}>‹</button>
          <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>›</button>
          <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟫</button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { background: "#fff", minHeight: "100vh", fontFamily: "sans-serif", fontSize: 14, color: "#1e293b" },
  toast:      { position: "fixed", top: 20, right: 24, zIndex: 9999, padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px 16px", borderBottom: "1px solid #e2e8f0" },
  pageTitle:  { fontSize: 20, fontWeight: 700, margin: 0 },
  pageSub:    { fontSize: 12, color: "#94a3b8", margin: "4px 0 0" },
  tabs:       { display: "flex", padding: "0 24px", borderBottom: "1px solid #e2e8f0" },
  tab:        { padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#64748b", borderBottom: "2px solid transparent", fontWeight: 500 },
  tabActive:  { color: "#2563eb", borderBottom: "2px solid #2563eb", fontWeight: 700 },
  toolbar:    { display: "flex", gap: 8, alignItems: "center", padding: "10px 24px", borderBottom: "1px solid #f1f5f9" },
  searchBox:  { position: "relative", flex: 1, maxWidth: 360, height: 34, border: "1.5px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center" },
  searchInput:{ border: "none", outline: "none", background: "transparent", paddingLeft: 30, width: "100%", fontSize: 13 },
  iconBtn:    { width: 34, height: 34, border: "1.5px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer" },
  table:      { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th:         { padding: "9px 14px", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" as const },
  tr:         { borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background .1s" },
  td:         { padding: "10px 14px", verticalAlign: "middle" as const },
  emptyCell:  { padding: "60px 0", textAlign: "center" as const, color: "#94a3b8" },
  spinner:    { width: 26, height: 26, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  delBtn:     { background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: 15, padding: 2 },
  footer:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", borderTop: "1px solid #e2e8f0", background: "#fafbff" },
  pageBtn:    { width: 28, height: 28, border: "1.5px solid #e2e8f0", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 12 },
  btnPrimary: { height: 36, padding: "0 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#2563eb,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
};