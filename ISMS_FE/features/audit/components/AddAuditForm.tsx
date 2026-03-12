// ============================================================
//  features/audit/components/AddAuditForm.tsx
//  Tạo mới phiếu kiểm kê
// ============================================================

"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore }          from "@/store/authStore";
import { useAuditForm }          from "../hooks/useAuditForm";
import { useAuditGoodsSearch }   from "../hooks/useAuditGoodsSearch";
import { getWarehouses }         from "../audit.api";
import AuditItemTable            from "./AuditItemTable";
import type { AuditType, AuditGoodsSearchResult } from "../types/audit.types";

export default function AddAuditForm() {
  const { user }        = useAuthStore();
  const currentUserId   = String(user?.userId   ?? "");
  const currentUserName = user?.fullName ?? "";

  const {
    voucher, message, loading, tabCounts,
    setField, addItem, removeItem, updateItem,
    handleSubmit,
  } = useAuditForm({ userId: currentUserId, userFullName: currentUserName });

  // Kho
  const [warehouses, setWarehouses] = useState<
    { warehouseId: string; warehouseName: string }[]
  >([]);
  useEffect(() => {
    getWarehouses().then(setWarehouses).catch(console.error);
  }, []);

  // ── Autocomplete hàng hóa ───────────────────────────────
  const handleSelectGoods = (index: number, goods: AuditGoodsSearchResult) => {
    updateItem(index, "goodsId",       goods.goodsId);
    updateItem(index, "goodsName",     goods.goodsName);
    updateItem(index, "unit",          goods.unit);
    updateItem(index, "stockQuantity", goods.itemOnHand);
    // Reset actualQuantity về 0 khi chọn hàng mới
    updateItem(index, "actualQuantity", 0);
  };

  const goodsSearch = useAuditGoodsSearch({
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem:     addItem,
  });

  // Khởi tạo 1 dòng trống
  const initialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current) { addItem(); initialized.current = true; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync dropdowns khi thêm / xóa item
  const prevLengthRef = React.useRef(voucher.items.length);
  useEffect(() => {
    const cur = voucher.items.length, prev = prevLengthRef.current;
    if (cur > prev)
      for (let i = 0; i < cur - prev; i++) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab hiện tại ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    "all" | "matched" | "surplus" | "deficit"
  >("all");

  const filteredItems = voucher.items.filter((item) => {
    if (!item.goodsId) return activeTab === "all"; // dòng trống chỉ hiện ở tab "all"
    if (activeTab === "matched") return item.difference === 0;
    if (activeTab === "surplus") return item.difference > 0;
    if (activeTab === "deficit") return item.difference < 0;
    return true;
  });

  // Tính index thực trong voucher.items cho filtered items
  const filteredIndices = voucher.items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => {
      if (!item.goodsId) return activeTab === "all";
      if (activeTab === "matched") return item.difference === 0;
      if (activeTab === "surplus") return item.difference > 0;
      if (activeTab === "deficit") return item.difference < 0;
      return true;
    })
    .map(({ i }) => i);

  return (
    <div style={s.container}>

      {/* ── Hero banner ─────────────────────────────────── */}
      <div style={s.hero}>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Kho hàng</div>
          <h1 style={s.heroTitle}>Thêm mới phiếu kiểm kê</h1>
        </div>
        {/* Số phiếu nổi ở góc phải */}
        <div style={s.voucherIdBadge}>
          <div style={s.voucherIdLabel}>Số phiếu kiểm kê</div>
          <input
            style={s.voucherIdInput}
            value={voucher.voucherId}
            onChange={(e) => setField("voucherId", e.target.value)}
          />
        </div>
      </div>

      {/* ── Thông tin phiếu ─────────────────────────────── */}
      <div style={s.infoGrid}>

        {/* Kho */}
        <div style={s.fieldRow}>
          <label style={s.label}>Kho</label>
          <select
            style={s.select}
            value={voucher.warehouseId}
            onChange={(e) => setField("warehouseId", e.target.value)}
          >
            <option value="">— Chọn kho —</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.warehouseName}
              </option>
            ))}
          </select>
        </div>

        {/* Loại kiểm kê */}
        <div style={s.fieldRow}>
          <label style={s.label}>Loại kiểm kê</label>
          <div style={{ display: "flex", gap: 20 }}>
            {([["FULL", "Toàn bộ"], ["PARTIAL", "Một phần"]] as [AuditType, string][]).map(
              ([val, label]) => (
                <label key={val} style={s.radio}>
                  <input
                    type="radio"
                    value={val}
                    checked={voucher.auditType === val}
                    onChange={() => setField("auditType", val)}
                    style={{ marginRight: 6, accentColor: "#1d4ed8" }}
                  />
                  {label}
                </label>
              )
            )}
          </div>
        </div>

        {/* Người lập phiếu */}
        <div style={s.fieldRow}>
          <label style={s.label}>Người lập phiếu</label>
          <input
            style={{ ...s.input, background: "#f5f5f5", color: "#555" }}
            value={currentUserName}
            readOnly
          />
        </div>

        {/* Ngày giờ kiểm kê */}
        <div style={s.fieldRow}>
          <label style={s.label}>Ngày giờ kiểm kê</label>
          <input
            type="datetime-local"
            style={s.input}
            value={voucher.auditDate}
            onChange={(e) => setField("auditDate", e.target.value)}
          />
        </div>

        {/* Diễn giải — full width */}
        <div style={{ ...s.fieldRow, gridColumn: "1 / -1" }}>
          <label style={s.label}>Diễn giải</label>
          <input
            style={s.input}
            placeholder="Nhập diễn giải..."
            value={voucher.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>
      </div>

      {/* ── Bảng hàng hóa ───────────────────────────────── */}
      <div style={s.tableCard}>

        {/* Tabs */}
        <div style={s.tabBar}>
          {([
            ["all",     "Hàng hóa",  tabCounts.total,   "#1d4ed8"],
            ["matched", "Khớp",      tabCounts.matched,  "#0369a1"],
            ["surplus", "Thừa",      tabCounts.surplus,  "#16a34a"],
            ["deficit", "Thiếu",     tabCounts.deficit,  "#dc2626"],
          ] as [typeof activeTab, string, number, string][]).map(
            ([tab, label, count, color]) => (
              <button
                key={tab}
                style={{
                  ...s.tab,
                  borderBottom: activeTab === tab
                    ? `3px solid ${color}` : "3px solid transparent",
                  color:        activeTab === tab ? color : "#64748b",
                  fontWeight:   activeTab === tab ? 700   : 500,
                }}
                onClick={() => setActiveTab(tab)}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    ...s.tabBadge,
                    background: activeTab === tab ? color : "#e2e8f0",
                    color:      activeTab === tab ? "#fff" : "#64748b",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          )}

          {/* Nút thêm dòng */}
          <button style={s.addRowBtn} onClick={addItem}>
            + Thêm dòng
          </button>
        </div>

        {/* Table */}
        <AuditItemTable
          items={filteredItems}
          dropdowns={filteredIndices.map((i) => goodsSearch.dropdowns[i] ?? { suggestions: [], loading: false, open: false })}
          dropdownPos={
            goodsSearch.dropdownPos
              ? {
                  ...goodsSearch.dropdownPos,
                  // remap index từ filtered → thực
                  index: filteredIndices.indexOf(goodsSearch.dropdownPos.index) !== -1
                    ? filteredIndices.indexOf(goodsSearch.dropdownPos.index)
                    : goodsSearch.dropdownPos.index,
                }
              : null
          }
          dropdownRefs={goodsSearch.dropdownRefs}
          inputRefs={goodsSearch.inputRefs}
          onUpdateItem={(filteredIndex, field, value) =>
            updateItem(filteredIndices[filteredIndex], field, value)
          }
          onRemoveItem={(filteredIndex) => removeItem(filteredIndices[filteredIndex])}
          onGoodsIdChange={(filteredIndex, value, total) =>
            goodsSearch.handleGoodsIdChange(filteredIndices[filteredIndex], value, total)
          }
          onInputFocus={(filteredIndex, e) =>
            goodsSearch.handleInputFocus(filteredIndices[filteredIndex], e)
          }
          onSelectGoods={(filteredIndex, goods, total) =>
            goodsSearch.handleSelectGoods(filteredIndices[filteredIndex], goods, total)
          }
          onSetDropdownPos={goodsSearch.setDropdownPos}
        />

        {/* Footer hint */}
        <div style={s.tableFooter}>
          <span style={s.hint}>Ctr + Insert để thêm dòng</span>
          <span style={s.totalCount}>
            Tổng số: <strong>{tabCounts.total}</strong>
          </span>
        </div>
      </div>

      {/* ── Summary chips ────────────────────────────────── */}
      {tabCounts.total > 0 && (
        <div style={s.summaryRow}>
          {[
            { label: "Khớp",  count: tabCounts.matched, bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
            { label: "Thừa",  count: tabCounts.surplus, bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
            { label: "Thiếu", count: tabCounts.deficit, bg: "#fff1f2", color: "#b91c1c", border: "#fca5a5" },
          ].map(({ label, count, bg, color, border }) => (
            <div key={label} style={{ ...s.summaryChip, background: bg, border: `1.5px solid ${border}`, color }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{count}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────── */}
      <div style={s.actions}>
        <button style={s.btnCancel}>Hủy</button>
        <button
          style={{ ...s.btnSave, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "⏳ Đang lưu..." : "💾 Lưu"}
        </button>

        {message && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 8,
            fontWeight: 600, fontSize: 13,
            background: message.includes("thành công") ? "#f0fdf4" : "#fff1f2",
            color:      message.includes("thành công") ? "#15803d" : "#b91c1c",
            border: `1.5px solid ${message.includes("thành công") ? "#bbf7d0" : "#fca5a5"}`,
          }}>
            {message.includes("thành công") ? "✅" : "⚠️"} {message}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "100%", margin: "0 auto",
    padding: "24px 32px", fontFamily: "sans-serif",
    fontSize: 14, color: "#1e293b",
  },

  // Hero
  hero: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)",
    borderRadius: 14, padding: "22px 28px", marginBottom: 20,
    boxShadow: "0 8px 24px rgba(29,78,216,0.28)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  heroOrb1: {
    position: "absolute", top: -40, right: 160,
    width: 160, height: 160, borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
  },
  heroOrb2: {
    position: "absolute", bottom: -30, left: 60,
    width: 110, height: 110, borderRadius: "50%",
    background: "rgba(255,255,255,0.04)",
  },
  heroEyebrow: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },

  // Voucher ID badge (góc phải hero)
  voucherIdBadge: {
    position: "relative", zIndex: 1,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10, padding: "10px 14px",
    textAlign: "right" as const,
  },
  voucherIdLabel: {
    fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5,
  },
  voucherIdInput: {
    background: "transparent", border: "none", outline: "none",
    color: "#fff", fontWeight: 700, fontSize: 16,
    textAlign: "right" as const, width: 160,
  },

  // Info grid
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 32px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12, padding: "18px 24px",
    marginBottom: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  fieldRow: {
    display: "flex", alignItems: "center", gap: 12,
  },
  label: {
    minWidth: 140, fontSize: 13,
    fontWeight: 600, color: "#475569",
    flexShrink: 0,
  },
  input: {
    flex: 1, height: 36, padding: "0 10px",
    border: "1.5px solid #e2e8f0", borderRadius: 7,
    fontSize: 13, outline: "none",
    transition: "border-color 0.15s",
  },
  select: {
    flex: 1, height: 36, padding: "0 10px",
    border: "1.5px solid #e2e8f0", borderRadius: 7,
    fontSize: 13, background: "#fff", cursor: "pointer",
    outline: "none",
  },
  radio: {
    display: "flex", alignItems: "center",
    cursor: "pointer", fontSize: 13, color: "#334155",
  },

  // Table card
  tableCard: {
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    marginBottom: 16,
  },

  // Tabs
  tabBar: {
    display: "flex", alignItems: "center", gap: 2,
    borderBottom: "1px solid #e2e8f0",
    padding: "0 16px",
  },
  tab: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "11px 14px", border: "none",
    background: "transparent", cursor: "pointer",
    fontSize: 13, transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },
  tabBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 18, height: 18, borderRadius: 9,
    fontSize: 10, fontWeight: 700, padding: "0 5px",
    transition: "all 0.15s",
  },
  addRowBtn: {
    marginLeft: "auto", height: 30, padding: "0 14px",
    border: "1.5px solid #1d4ed8", borderRadius: 7,
    background: "#eff6ff", color: "#1d4ed8",
    fontWeight: 600, fontSize: 12, cursor: "pointer",
  },

  // Table footer
  tableFooter: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 16px", borderTop: "1px solid #f1f5f9",
    background: "#fafbff",
  },
  hint:       { fontSize: 11, color: "#94a3b8", fontStyle: "italic" },
  totalCount: { fontSize: 12, color: "#64748b" },

  // Summary chips
  summaryRow: {
    display: "flex", gap: 12, marginBottom: 20,
  },
  summaryChip: {
    display: "flex", flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center",
    gap: 3, padding: "12px 24px", borderRadius: 10,
    minWidth: 90,
  },

  // Actions
  actions: {
    display: "flex", alignItems: "center", gap: 12,
  },
  btnCancel: {
    height: 38, padding: "0 24px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", background: "#fff",
    color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  btnSave: {
    height: 38, padding: "0 28px", borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
    boxShadow: "0 4px 12px rgba(29,78,216,0.3)",
  },
};