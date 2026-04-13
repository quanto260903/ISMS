// features/stock-take/components/StockTakeListPage.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getStockTakeList, deleteStockTake } from "../stockTake.api";
import type { StockTakeListDto } from "../types/stockTake.types";

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

// ── Delete Confirm Modal ───────────────────────────────────────
function DeleteConfirmModal({
  row, busy, onConfirm, onClose,
}: {
  row: StockTakeListDto;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div style={dm.overlay} onClick={onClose}>
      <div style={dm.box} onClick={(e) => e.stopPropagation()}>
        <div style={dm.head}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#b91c1c" }}>🗑 Xác nhận xóa phiếu</span>
          <button style={dm.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 20, lineHeight: 1.7 }}>
            Bạn có chắc muốn xóa phiếu{" "}
            <strong style={{ color: "#6d28d9", fontFamily: "monospace" }}>{row.stockTakeVoucherId}</strong>?
            <br />Hành động này <strong>không thể hoàn tác</strong>.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={dm.btnSec} onClick={onClose} disabled={busy}>Hủy</button>
            <button style={dm.btnDel} onClick={onConfirm} disabled={busy}>
              {busy ? "⏳ Đang xóa..." : "🗑 Xóa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockTakeListPage() {
  const router    = useRouter();
  const PAGE_SIZE = 20;

  const [allRows,      setAllRows]      = useState<StockTakeListDto[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [keyword,      setKeyword]      = useState("");
  const [filterDone,   setFilterDone]   = useState<boolean | "">("");
  const [page,         setPage]         = useState(1);
  const [refreshTick,  setRefreshTick]  = useState(0);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockTakeListDto | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setAllRows(await getStockTakeList());
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tải dữ liệu", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Refresh localStorage-based status when user returns to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefreshTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const isDoneById = useCallback((id: string) =>
    typeof window !== "undefined" && (
      localStorage.getItem(`nk3_done_${id}`) === "true" ||
      localStorage.getItem(`xk3_done_${id}`) === "true"
    ),
  [refreshTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredRows = useMemo(() => {
    let items = allRows;
    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(
        (i) => i.stockTakeVoucherId.toLowerCase().includes(kw) || (i.purpose ?? "").toLowerCase().includes(kw)
      );
    }
    if (filterDone !== "") items = items.filter((i) => isDoneById(i.stockTakeVoucherId) === filterDone);
    return items;
  }, [allRows, keyword, filterDone, isDoneById]);

  const pagedRows  = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );
  const total      = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setFilter = (done: boolean | "") => { setFilterDone(done); setPage(1); };
  const setSearch = (kw: string)         => { setKeyword(kw);       setPage(1); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStockTake(deleteTarget.stockTakeVoucherId);
      showToast("Đã xóa phiếu");
      setDeleteTarget(null);
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi xóa", false);
    } finally { setDeleting(false); }
  };

  const TABS = [
    { label: "Tất cả",      value: ""    as const },
    { label: "Chưa xử lý", value: false as const },
    { label: "Đã xử lý",   value: true  as const },
  ];

  return (
    <div style={{ padding: 0, minHeight: "100vh", background: "#f8faff", fontFamily: FONT, display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          background: toast.ok ? "#f0fdf4" : "#fff1f2",
          color:      toast.ok ? "#15803d" : "#b91c1c",
          border:     `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}`,
        }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* ── Hero banner ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>WMS Pro · Quản lý kho</div>
          <h1 style={s.heroTitle}>Danh sách phiếu kiểm kê</h1>
          <p style={s.heroSub}>Quản lý toàn bộ phiếu kiểm kê, đối chiếu tồn sách và thực tế</p>
        </div>
        <button style={s.btnPrimary} onClick={() => router.push("/dashboard/stock-take/create")}>
          <span style={{ fontSize: 16 }}>+</span> Tạo phiếu kiểm kê
        </button>
      </div>

      {/* ── Filter card ── */}
      <div style={s.filterCard}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
          {TABS.map((tab) => (
            <button key={String(tab.value)}
              style={{
                padding: "6px 16px", border: "none", borderRadius: 20,
                cursor: "pointer", fontSize: 13, fontWeight: filterDone === tab.value ? 700 : 500,
                background: filterDone === tab.value ? "#6d28d9" : "#f1f5f9",
                color:      filterDone === tab.value ? "#fff"    : "#64748b",
                transition: "all 0.12s",
              }}
              onClick={() => setFilter(tab.value)}>
              {tab.label}
            </button>
          ))}
        </div>
        {/* Search row */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" as const }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 5 }}>
            <label style={s.filterLabel}>Tìm kiếm</label>
            <div style={{ position: "relative" }}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={{ ...s.filterInput, paddingLeft: 32, width: "100%" }}
                placeholder="Nhập mã phiếu, mục đích..."
                value={keyword}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button style={s.btnRefresh} onClick={fetchData} title="Làm mới">
            <span style={{ fontSize: 18 }}>↺</span>
          </button>
        </div>
      </div>

      {/* ── Table card ── */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr style={s.theadRow}>
              <th style={s.th}>Số phiếu KK</th>
              <th style={s.th}>Ngày lập</th>
              <th style={s.th}>Ngày kiểm</th>
              <th style={s.th}>Mục đích</th>
              <th style={s.th}>Người lập</th>
              <th style={{ ...s.th, textAlign: "center" }}>Trạng thái</th>
              <th style={{ ...s.th, textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={s.statusCell}>
                <div style={s.loadingSpinner}>
                  <div style={s.spinnerRing} />
                  <span>Đang tải dữ liệu...</span>
                </div>
              </td></tr>
            )}
            {!loading && pagedRows.length === 0 && (
              <tr><td colSpan={7} style={s.statusCell}>
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>📋</div>
                  <p style={{ fontWeight: 600, color: "#374151" }}>
                    {allRows.length === 0 ? "Chưa có phiếu kiểm kê nào" : "Không tìm thấy kết quả"}
                  </p>
                  {allRows.length === 0 && (
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                      Nhấn &quot;Tạo phiếu kiểm kê&quot; để bắt đầu
                    </p>
                  )}
                </div>
              </td></tr>
            )}
            {!loading && pagedRows.map((row, i) => (
              <StockTakeRow key={row.stockTakeVoucherId} row={row} i={i}
                onView={() => router.push(`/dashboard/stock-take/${row.stockTakeVoucherId}`)}
                onDelete={() => setDeleteTarget(row)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div style={s.footer}>
        <span style={{ color: "#64748b", fontSize: 13 }}>
          Tổng số: <strong style={{ color: "#1e293b" }}>{total}</strong> phiếu
          {total > 0 && (
            <span style={{ color: "#94a3b8", marginLeft: 8 }}>
              ({(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)})
            </span>
          )}
        </span>
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(1)}>⟨⟨</button>
          <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage((p) => p - 1)}>⟨</button>
          <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>⟩</button>
          <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟩⟩</button>
        </div>
      </div>

      {deleteTarget && (
        <DeleteConfirmModal row={deleteTarget} busy={deleting}
          onConfirm={handleDeleteConfirm} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────
function StockTakeRow({ row, i, onView, onDelete }: {
  row: StockTakeListDto; i: number;
  onView: () => void; onDelete: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  const isDone =
    typeof window !== "undefined" && (
      localStorage.getItem(`nk3_done_${row.stockTakeVoucherId}`) === "true" ||
      localStorage.getItem(`xk3_done_${row.stockTakeVoucherId}`) === "true"
    );
  return (
    <tr
      style={{ background: hover ? "#f5f3ff" : i % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.12s", cursor: "pointer" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={onView}
    >
      <td style={{ ...s.td, fontWeight: 700, color: "#6d28d9", fontFamily: "monospace" }}>{row.stockTakeVoucherId}</td>
      <td style={{ ...s.td, color: "#64748b" }}>{new Date(row.voucherDate).toLocaleDateString("vi-VN")}</td>
      <td style={{ ...s.td, color: "#64748b" }}>{new Date(row.stockTakeDate).toLocaleDateString("vi-VN")}</td>
      <td style={{ ...s.td, maxWidth: 260 }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.purpose || <span style={{ color: "#94a3b8" }}>--</span>}
        </div>
      </td>
      <td style={{ ...s.td, color: "#64748b", fontSize: 12 }}>{row.createdBy || "--"}</td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <span style={{
          padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
          background: isDone ? "#f0fdf4" : "#fffbeb",
          color:      isDone ? "#15803d" : "#d97706",
          border:     `1.5px solid ${isDone ? "#86efac" : "#fde68a"}`,
        }}>
          {isDone ? "✓ Đã xử lý" : "◑ Chưa xử lý"}
        </span>
      </td>
      <td style={{ ...s.td, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <button style={s.btnView} onClick={onView}>✏️ Xem</button>
        <button style={{ ...s.btnView, marginLeft: 6, color: "#b91c1c", borderColor: "#fca5a5", background: "#fff1f2" }}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          🗑
        </button>
      </td>
    </tr>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  heroBanner: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #3b82f6 100%)",
    borderRadius: 14, padding: "24px 28px", marginBottom: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    boxShadow: "0 8px 24px rgba(109,40,217,0.3)",
  },
  heroOrb:  { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)" },
  heroOrb2: { position: "absolute", bottom: -30, left: 100, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.3px" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4, marginBottom: 0 },
  btnPrimary: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "11px 22px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
    color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10,
    fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0,
    transition: "background 0.15s", letterSpacing: "0.02em",
  },
  filterCard: {
    background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 16,
    border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  filterLabel: { fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  filterInput: {
    height: 38, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
    fontSize: 13, background: "#fff", color: "#1e293b", outline: "none", width: "100%",
    boxSizing: "border-box" as const,
  },
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, pointerEvents: "none" as const },
  btnRefresh: {
    height: 38, width: 38, border: "1.5px solid #e2e8f0", borderRadius: 8,
    background: "#f8faff", cursor: "pointer", fontSize: 20,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#7c3aed", transition: "background 0.15s", marginTop: 22,
  },
  tableCard: {
    overflowX: "auto" as const, background: "#fff", borderRadius: 12,
    border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 16,
  },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  theadRow: { background: "linear-gradient(135deg, #6d28d9, #4f46e5)" },
  th: { padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" as const, fontSize: 12, letterSpacing: "0.04em" },
  td: { padding: "11px 16px", borderBottom: "1px solid #f1f5f9", color: "#334155", fontSize: 13 },
  statusCell: { padding: "40px 32px", textAlign: "center" as const, color: "#94a3b8", fontSize: 14 },
  loadingSpinner: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12, color: "#7c3aed", fontWeight: 500 },
  spinnerRing: { width: 36, height: 36, borderRadius: "50%", border: "3px solid #ede9fe", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite" },
  emptyState: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4 },
  emptyIcon: { fontSize: 36, marginBottom: 4, filter: "grayscale(0.5)" },
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px", background: "#fff", borderRadius: 12,
    border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  pagination: { display: "flex", alignItems: "center", gap: 6 },
  pageBtn: {
    width: 32, height: 32, border: "1.5px solid #e2e8f0", borderRadius: 7,
    background: "#f8faff", cursor: "pointer", fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#6d28d9", fontWeight: 700,
  },
  btnView: { padding: "4px 12px", border: "1.5px solid #ddd6fe", borderRadius: 7, background: "#f5f3ff", color: "#6d28d9", fontWeight: 700, fontSize: 12, cursor: "pointer" },
};

const dm: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" },
  box:     { background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", width: 420, overflow: "hidden" },
  head:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #fecaca", background: "#fff1f2" },
  closeBtn:{ width: 26, height: 26, border: "none", background: "#fecaca", color: "#b91c1c", borderRadius: 6, cursor: "pointer", fontWeight: 700 },
  btnSec:  { height: 34, padding: "0 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnDel:  { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
};