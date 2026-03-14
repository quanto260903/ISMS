// features/open-inventory/components/OpenInventoryPage.tsx

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  getOpenInventoryList, getOpenInventorySummary,
  upsertOpenInventory, deleteOpenInventoryRow,
} from "../openInventory.api";
import { searchGoods } from "@/features/goods/goods.api";
import type { OpenInventoryRowDto, EditingRow } from "../types/openInventory.types";
import type { GoodsSearchResult } from "@/features/goods/types/goods.types";

const fmtNum = (n: number) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────
//  GOODS PICKER MODAL
// ─────────────────────────────────────────────────────────────
function GoodsPickerModal({ onPick, onClose }: {
  onPick:  (g: GoodsSearchResult) => void;
  onClose: () => void;
}) {
  const [kw, setKw]           = useState("");
  const [results, setResults] = useState<GoodsSearchResult[]>([]);
  const [busy, setBusy]       = useState(false);
  const timer                 = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!kw.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try { setResults(await searchGoods(kw, 20)); }
      catch { setResults([]); }
      finally { setBusy(false); }
    }, 300);
  }, [kw]);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modalBox, width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={mHeader}>
          <span style={mTitle}>🔍 Chọn hàng hóa</span>
          <button style={mClose} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "14px 20px 20px" }}>
          <input autoFocus style={{ ...inp, marginBottom: 10 }}
            placeholder="Nhập mã hàng hoặc tên hàng..."
            value={kw} onChange={(e) => setKw(e.target.value)} />

          {busy && <p style={hint}>⏳ Đang tìm...</p>}
          {!busy && kw && results.length === 0 && <p style={hint}>Không tìm thấy</p>}
          {!busy && !kw && <p style={{ ...hint, color: "#cbd5e1" }}>Nhập từ khóa để tìm kiếm</p>}

          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {results.map((g) => (
              <div key={g.goodsId} style={pickerRow}
                onClick={() => onPick(g)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fafbff")}>
                <div>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8", fontSize: 12 }}>
                    {g.goodsId}
                  </span>
                  <span style={{ marginLeft: 10, fontWeight: 600 }}>{g.goodsName}</span>
                </div>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{g.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function OpenInventoryPage() {
  const PAGE_SIZE = 50;

  const [keyword, setKeyword]       = useState("");
  const [page, setPage]             = useState(1);
  const [rows, setRows]             = useState<OpenInventoryRowDto[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalQty, setTotalQty]     = useState(0);
  const [totalVal, setTotalVal]     = useState(0);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editMap, setEditMap]       = useState<Record<string, EditingRow>>({});
  const [dirtySet, setDirtySet]     = useState<Set<string>>(new Set());

  // ── Fetch ─────────────────────────────────────────────────
  const fetchData = useCallback(async (kw: string, p: number) => {
    setLoading(true); setError("");
    try {
      const [list, summary] = await Promise.all([
        getOpenInventoryList({ keyword: kw || undefined, page: p, pageSize: PAGE_SIZE }),
        getOpenInventorySummary(),
      ]);
      setRows(list.items);
      setTotal(list.total);
      setTotalQty(summary.totalQuantity);
      setTotalVal(summary.totalValue);

      const map: Record<string, EditingRow> = {};
      list.items.forEach((r) => {
        map[r.goodsId] = {
          goodsId:      r.goodsId,
          quantity:     String(r.quantity),
          debitAmount0: String(r.debitAmount0),
          unit:         r.unit,
        };
      });
      setEditMap(map);
      setDirtySet(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(keyword, page); }, [page]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  // ── Inline edit ───────────────────────────────────────────
  const handleCell = (id: string, field: keyof EditingRow, val: string) => {
    setEditMap((p) => ({ ...p, [id]: { ...p[id], [field]: val } }));
    setDirtySet((p) => new Set(p).add(id));
  };

  // ── Auto-save khi blur ────────────────────────────────────
  const handleBlur = async (id: string) => {
    if (!dirtySet.has(id)) return;
    const ed = editMap[id];
    if (!ed) return;
    setSaving(true);
    try {
      await upsertOpenInventory({
        goodsId:      ed.goodsId,
        unit:         ed.unit,
        quantity:     Number(ed.quantity)     || 0,
        debitAmount0: Number(ed.debitAmount0) || 0,
      });
      setDirtySet((p) => { const s = new Set(p); s.delete(id); return s; });

      // Cập nhật local row
      const qty   = Number(ed.quantity)     || 0;
      const price = Number(ed.debitAmount0) || 0;
      setRows((prev) => prev.map((r) => r.goodsId === id
        ? { ...r, quantity: qty, debitAmount0: price, totalValue: qty * price, unit: ed.unit }
        : r));

      // Refresh tổng
      const s = await getOpenInventorySummary();
      setTotalQty(s.totalQuantity); setTotalVal(s.totalValue);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi lưu", false);
    } finally { setSaving(false); }
  };

  // ── Xóa dòng ─────────────────────────────────────────────
  const handleDelete = async (row: OpenInventoryRowDto) => {
    if (!confirm(`Xóa tồn đầu của "${row.goodsName}"?`)) return;
    try {
      await deleteOpenInventoryRow(row.goodsId);
      showToast("Đã xóa");
      fetchData(keyword, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi xóa", false);
    }
  };

  // ── Thêm từ picker ───────────────────────────────────────
  const handlePick = async (g: GoodsSearchResult) => {
    setShowPicker(false);
    if (rows.find((r) => r.goodsId === g.goodsId)) {
      showToast(`"${g.goodsName}" đã có trong danh sách`, false); return;
    }
    setSaving(true);
    try {
      await upsertOpenInventory({ goodsId: g.goodsId, unit: g.unit, quantity: 0, debitAmount0: 0 });
      showToast(`Đã thêm "${g.goodsName}"`);
      fetchData(keyword, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi thêm", false);
    } finally { setSaving(false); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#f0fdf4" : "#fff1f2",
          color: toast.ok ? "#15803d" : "#b91c1c",
          border: `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}` }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={s.header}>
        <h1 style={s.title}>Tồn kho hàng hóa</h1>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input style={s.searchInput}
            placeholder="Tìm kiếm thông minh bằng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchData(keyword, 1); } }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={s.iconBtn} onClick={() => fetchData(keyword, page)} title="Làm mới">🔄</button>
          <button style={s.iconBtn} title="Xuất Excel">📊</button>
          <button style={s.btnMain} onClick={() => setShowPicker(true)} disabled={saving}>
            {saving ? "⏳" : "+"} Cập nhật tồn kho hàng hóa
          </button>
          <button style={s.btnCaret}>▾</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        {error && <div style={{ padding: 16, color: "#b91c1c" }}>⚠️ {error}</div>}
        <table style={s.table}>
          <thead>
            <tr>
              {[
                { label: "Mã hàng hóa",  w: 120, right: false },
                { label: "Tên hàng hóa", w: null, right: false },
                { label: "Đơn vị tính",  w: 100, right: true  },
                { label: "SL tồn",       w: 110, right: true  },
                { label: "Đơn giá tồn",  w: 140, right: true  },
                { label: "Giá trị tồn",  w: 140, right: true  },
                { label: "",             w: 40,  right: true  },
              ].map(({ label, w, right }) => (
                <th key={label} style={{ ...s.th, width: w ?? undefined,
                  textAlign: right ? "right" : "left" }}>{label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan={7} style={s.centerCell}>
                <div style={s.spinner} />
                <div style={{ color: "#94a3b8", marginTop: 8, fontSize: 13 }}>Đang tải...</div>
              </td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} style={s.centerCell}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Chưa có dữ liệu tồn đầu</div>
                <button style={{ ...s.btnMain, marginTop: 12 }} onClick={() => setShowPicker(true)}>
                  + Cập nhật tồn kho hàng hóa
                </button>
              </td></tr>
            )}

            {!loading && rows.map((row, i) => {
              const ed    = editMap[row.goodsId];
              const dirty = dirtySet.has(row.goodsId);
              const qty   = Number(ed?.quantity)     || 0;
              const price = Number(ed?.debitAmount0) || 0;

              return (
                <tr key={row.goodsId} style={{
                  background:    i % 2 === 0 ? "#fff" : "#fafbff",
                  borderBottom:  "1px solid #f1f5f9",
                  outline:       dirty ? "2px solid #bfdbfe" : undefined,
                  outlineOffset: dirty ? "-1px"              : undefined,
                }}>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#334155" }}>
                    {row.goodsId}
                  </td>
                  <td style={{ ...s.td, fontWeight: 500 }}>{row.goodsName}</td>

                  {/* ĐVT */}
                  <td style={{ ...s.td, textAlign: "right", fontWeight: 600, fontSize: 12 }}>
                    {row.unit}
                  </td>

                  {/* SL tồn — editable */}
                  <td style={s.td}>
                    <input type="number" min={0}
                      style={{ ...s.cell, textAlign: "right", fontWeight: 700,
                        color: qty > 0 ? "#1e293b" : "#94a3b8" }}
                      value={ed?.quantity ?? "0"}
                      onChange={(e) => handleCell(row.goodsId, "quantity", e.target.value)}
                      onBlur={() => handleBlur(row.goodsId)}
                    />
                  </td>

                  {/* Đơn giá — editable */}
                  <td style={s.td}>
                    <input type="number" min={0}
                      style={{ ...s.cell, textAlign: "right" }}
                      value={ed?.debitAmount0 ?? "0"}
                      onChange={(e) => handleCell(row.goodsId, "debitAmount0", e.target.value)}
                      onBlur={() => handleBlur(row.goodsId)}
                    />
                  </td>

                  {/* Giá trị tồn — computed */}
                  <td style={{ ...s.td, textAlign: "right", fontWeight: 600 }}>
                    {fmtNum(qty * price)}
                  </td>

                  {/* Xóa */}
                  <td style={{ ...s.td, textAlign: "center" }}>
                    <button style={s.delBtn} onClick={() => handleDelete(row)} title="Xóa">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer tổng */}
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #e2e8f0" }}>
                <td colSpan={3} style={{ ...s.td, textAlign: "right", color: "#64748b", fontSize: 12 }}>
                  Tổng số:
                </td>
                <td style={{ ...s.td, textAlign: "right" }}>{fmtNum(totalQty)}</td>
                <td style={s.td} />
                <td style={{ ...s.td, textAlign: "right", color: "#1d4ed8" }}>{fmtNum(totalVal)}</td>
                <td style={s.td} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      <div style={s.footerBar}>
        <span style={{ fontSize: 13, color: "#475569" }}>
          Tổng số: <strong>{total}</strong>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>Số bản ghi trên trang</span>
          <select style={s.pageSizeSelect}>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ fontSize: 13, color: "#475569" }}>
            {total === 0 ? "0 - 0" : `${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, total)}`}
          </span>
          <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(1)}>⟪</button>
          <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage((p) => p - 1)}>‹</button>
          <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
          <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟫</button>
        </div>
      </div>

      {showPicker && <GoodsPickerModal onPick={handlePick} onClose={() => setShowPicker(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:          { background: "#fff", minHeight: "100vh", fontFamily: "sans-serif", fontSize: 14 },
  toast:         { position: "fixed", top: 20, right: 24, zIndex: 99999, padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
  header:        { padding: "20px 24px 14px", borderBottom: "1px solid #e2e8f0" },
  title:         { fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 },
  toolbar:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: "1px solid #f1f5f9", gap: 10 },
  searchWrap:    { position: "relative", flex: 1, maxWidth: 360, height: 34, border: "1.5px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", background: "#fff" },
  searchIcon:    { position: "absolute", left: 9, fontSize: 14, color: "#94a3b8" },
  searchInput:   { border: "none", outline: "none", background: "transparent", paddingLeft: 30, width: "100%", fontSize: 13 },
  iconBtn:       { width: 34, height: 34, border: "1.5px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 14 },
  btnMain:       { height: 34, padding: "0 14px", borderRadius: "8px 0 0 8px", border: "none", background: "linear-gradient(135deg,#2563eb,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnCaret:      { width: 32, height: 34, border: "1.5px solid #2563eb", borderRadius: "0 8px 8px 0", marginLeft: -1, background: "#eff6ff", color: "#2563eb", fontWeight: 700, cursor: "pointer" },
  table:         { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th:            { padding: "9px 12px", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" as const },
  td:            { padding: "6px 12px", verticalAlign: "middle" as const },
  cell:          { width: "100%", height: 28, padding: "0 6px", border: "1px solid transparent", borderRadius: 4, fontSize: 13, background: "transparent", outline: "none", boxSizing: "border-box" as const },
  delBtn:        { width: 22, height: 22, border: "none", borderRadius: 4, background: "transparent", color: "#cbd5e1", cursor: "pointer", fontSize: 11 },
  centerCell:    { padding: "56px 0", textAlign: "center" as const, color: "#94a3b8" },
  spinner:       { width: 26, height: 26, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  footerBar:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", borderTop: "1px solid #e2e8f0", background: "#fafbff" },
  pageSizeSelect:{ height: 26, borderRadius: 5, border: "1px solid #e2e8f0", padding: "0 4px", fontSize: 12 },
  pageBtn:       { width: 26, height: 26, border: "1.5px solid #e2e8f0", borderRadius: 5, background: "#fff", cursor: "pointer", fontSize: 12 },
};

const overlay:   React.CSSProperties = { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" };
const modalBox:  React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto" };
const mHeader:   React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 0" };
const mTitle:    React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "#1e293b" };
const mClose:    React.CSSProperties = { width: 26, height: 26, border: "none", background: "#f1f5f9", color: "#64748b", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const inp:       React.CSSProperties = { width: "100%", height: 36, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" as const };
const pickerRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: "1px solid #f1f5f9", marginBottom: 6, background: "#fafbff", transition: "background 0.1s" };
const hint:      React.CSSProperties = { textAlign: "center", color: "#94a3b8", padding: "16px 0", fontSize: 13 };