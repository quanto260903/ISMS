// features/stock-take/components/StockTakeCreatePage.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getGoodsAsOfDate, createStockTake, previewNextVoucherCode } from "../stockTake.api";
import type { GoodsDto, CreateStockTakeDetailRequest } from "../types/stockTake.types";
import { MemberPanel } from "./MemberPanel";

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

const fmtNum = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fmtDate = (s: string | null) =>
  s ? new Date(s + "T00:00:00").toLocaleDateString("vi-VN") : "--";

function getNameFromToken(): string {
  try {
    const token = localStorage.getItem("token") ?? "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload["name"] ?? payload["fullName"] ?? payload["unique_name"] ??
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
      payload["sub"] ?? ""
    );
  } catch { return ""; }
}

interface LineRow {
  _id:            number;
  _touched:       boolean;
  _locked:        boolean;
  goodsId:        string;
  goodsName:      string;
  unit:           string | null;
  bookQuantity:   number;   
  actualQuantity: number;
}

function getXuLy(line: LineRow): { label: string; color: string; bg: string; border: string } | null {
  if (!line._touched) return null;
  const diff = line.actualQuantity - line.bookQuantity;
  if (diff > 0) return { label: "Nhập kho", color: "#15803d", bg: "#f0fdf4", border: "#86efac" };
  if (diff < 0) return { label: "Xuất kho", color: "#b91c1c", bg: "#fff1f2", border: "#fca5a5" };
  return        { label: "Khớp ✓",   color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" };
}

// ── Modal cảnh báo hàng chưa kiểm ────────────────────────────
function UncheckedWarningModal({ rows, onContinue, onClose, saveError }: {
  rows: GoodsDto[]; onContinue: () => void; onClose: () => void; saveError?: string;
}) {
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>⚠️ Còn {rows.length} mặt hàng chưa được kiểm kê</span>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 22px 22px" }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 14, lineHeight: 1.7 }}>
            Những mặt hàng dưới đây chưa được nhập số lượng thực tế.
            Bạn muốn quay lại kiểm hay lưu luôn?
          </p>
          <div style={{ border: "1px solid #fde68a", borderRadius: 8, overflow: "hidden", maxHeight: 260, overflowY: "auto", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fffbeb", position: "sticky" as const, top: 0 }}>
                  <th style={m.th}>Mã hàng</th>
                  <th style={m.th}>Tên hàng hóa</th>
                  <th style={{ ...m.th, textAlign: "center" }}>ĐVT</th>
                  <th style={{ ...m.th, textAlign: "right" }}>Tồn sách</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.goodsId} style={{ background: i % 2 === 0 ? "#fff" : "#fffbeb", borderTop: "1px solid #fde68a" }}>
                    <td style={m.td}><span style={{ fontFamily: "monospace", color: "#92400e" }}>{r.goodsId}</span></td>
                    <td style={m.td}>{r.goodsName}</td>
                    <td style={{ ...m.td, textAlign: "center", color: "#64748b" }}>{r.unit ?? "--"}</td>
                    <td style={{ ...m.td, textAlign: "right", fontFamily: "monospace" }}>{fmtNum(r.stockQuantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {saveError && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 7, color: "#b91c1c", fontSize: 12 }}>
              ⚠️ {saveError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={m.btnSec} onClick={onClose}>← Quay lại kiểm</button>
            <button style={m.btnWarn} onClick={onContinue}>Lưu luôn</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockTakeCreatePage() {
  const router = useRouter();
  const today  = new Date().toISOString().slice(0, 10);

  const [previewCode,   setPreviewCode]   = useState("");
  const [createdBy,     setCreatedBy]     = useState("");
  const [voucherDate,   setVoucherDate]   = useState(today);
  const [stockTakeDate, setStockTakeDate] = useState(today);
  const [purpose,       setPurpose]       = useState("");
  const [member1, setMember1] = useState(""); const [position1, setPosition1] = useState("");
  const [member2, setMember2] = useState(""); const [position2, setPosition2] = useState("");
  const [member3, setMember3] = useState(""); const [position3, setPosition3] = useState("");

  const [lines,        setLines]        = useState<LineRow[]>([]);
  const [allGoods,     setAllGoods]     = useState<GoodsDto[]>([]);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const [idCounter,    setIdCounter]    = useState(1);
  const [activeTab,    setActiveTab]    = useState<"goods" | "unchecked">("goods");
  const [keyword,      setKeyword]      = useState("");
  const [saving,       setSaving]       = useState(false);
  const [showWarning,  setShowWarning]  = useState(false);
  const [error,        setError]        = useState("");
  const [addKeyword,    setAddKeyword]    = useState("");
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [uncheckedPage, setUncheckedPage] = useState(1);
  const UNCHECKED_PAGE_SIZE = 10;
  const [pendingDate,   setPendingDate]   = useState<string | null>(null);

  const hasEnteredData = lines.some((l) => l.goodsId.trim() !== "");

  const handleStockTakeDateChange = (newDate: string) => {
    if (!newDate || newDate === stockTakeDate) return;
    if (hasEnteredData) {
      setPendingDate(newDate);
    } else {
      setStockTakeDate(newDate);
    }
  };

  const confirmDateChange = () => {
    if (!pendingDate) return;
    setLines([]);
    setIdCounter(1);
    setStockTakeDate(pendingDate);
    setPendingDate(null);
  };

  useEffect(() => {
    setCreatedBy(getNameFromToken());
    previewNextVoucherCode().then(setPreviewCode).catch(() => {});
  }, []);

  // Khi ngày kiểm kê thay đổi → tải lại hàng hóa với tồn kho theo ngày đó
  useEffect(() => {
    if (!stockTakeDate) {
      setAllGoods([]);
      return;
    }
    setGoodsLoading(true);
    getGoodsAsOfDate(stockTakeDate)
      .then((goods) => {
        setAllGoods(goods);
        // Cập nhật bookQuantity của các dòng đã chọn theo tồn kho mới
        const stockMap = new Map(goods.map((g) => [g.goodsId, g.stockQuantity]));
        setLines((prev) =>
          prev.map((l) =>
            l._locked && stockMap.has(l.goodsId)
              ? { ...l, bookQuantity: stockMap.get(l.goodsId)! }
              : l
          )
        );
      })
      .catch(() => {})
      .finally(() => setGoodsLoading(false));
  }, [stockTakeDate]);

  const dropdownGoods = useMemo(() => {
    if (!addKeyword.trim()) return allGoods.slice(0, 20);
    const kw = addKeyword.toLowerCase();
    return allGoods
      .filter((g) => g.goodsId.toLowerCase().includes(kw) || g.goodsName.toLowerCase().includes(kw))
      .slice(0, 20);
  }, [allGoods, addKeyword]);

  const pickGoods = (g: GoodsDto) => {
    if (lines.some((l) => l.goodsId === g.goodsId)) {
      setAddKeyword(""); setShowDropdown(false); return;
    }
    setLines((prev) => [...prev, {
      _id: idCounter, _touched: false, _locked: true,
      goodsId: g.goodsId, goodsName: g.goodsName,
      unit: g.unit,
      bookQuantity: g.stockQuantity,    // hiển thị, không gửi backend
      actualQuantity: g.stockQuantity,
    }]);
    setIdCounter((c) => c + 1);
    setAddKeyword(""); setShowDropdown(false);
  };

  const addBlankRow = () => {
    setLines((prev) => [...prev, {
      _id: idCounter, _touched: false, _locked: false,
      goodsId: "", goodsName: "", unit: "", bookQuantity: 0, actualQuantity: 0,
    }]);
    setIdCounter((c) => c + 1);
  };

  const updateActual = (id: number, val: string) =>
    setLines((prev) => prev.map((l) =>
      l._id === id
        ? { ...l, actualQuantity: Math.max(0, parseInt(val || "0", 10) || 0), _touched: true }
        : l
    ));

  const updateField = (id: number, field: string, value: string | number) =>
    setLines((prev) => prev.map((l) => l._id === id ? { ...l, [field]: value } : l));

  const removeRow = (id: number) =>
    setLines((prev) => prev.filter((l) => l._id !== id));

  const checkedIds    = useMemo(() => new Set(lines.filter((l) => l.goodsId.trim() !== "").map((l) => l.goodsId)), [lines]);
  const uncheckedRows = useMemo(() => allGoods.filter((g) => !checkedIds.has(g.goodsId)), [allGoods, checkedIds]);

  const visibleLines = useMemo(() => {
    if (!keyword) return lines;
    const kw = keyword.toLowerCase();
    return lines.filter((l) => l.goodsId.toLowerCase().includes(kw) || l.goodsName.toLowerCase().includes(kw));
  }, [lines, keyword]);

  const filteredUnchecked = useMemo(() => {
    if (!keyword) return uncheckedRows;
    const kw = keyword.toLowerCase();
    return uncheckedRows.filter((g) => g.goodsId.toLowerCase().includes(kw) || g.goodsName.toLowerCase().includes(kw));
  }, [uncheckedRows, keyword]);

  // Reset trang khi filter thay đổi
  const uncheckedTotalPages = Math.max(1, Math.ceil(filteredUnchecked.length / UNCHECKED_PAGE_SIZE));
  const safeUncheckedPage   = Math.min(uncheckedPage, uncheckedTotalPages);
  const visibleUnchecked    = filteredUnchecked.slice(
    (safeUncheckedPage - 1) * UNCHECKED_PAGE_SIZE,
    safeUncheckedPage * UNCHECKED_PAGE_SIZE,
  );

  const handleSaveClick = () => {
    if (!voucherDate || !stockTakeDate) { setError("Vui lòng điền đầy đủ ngày"); return; }
    setError("");
    if (uncheckedRows.length > 0) { setShowWarning(true); return; }
    doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const stockTakeDetails: CreateStockTakeDetailRequest[] = lines.map((l) => ({
        goodsId:        l.goodsId,
        goodsName:      l.goodsName,
        unit:           l.unit,
        actualQuantity: l.actualQuantity,
        // bookQuantity đã xóa
      }));

      const result = await createStockTake({
        // voucherCode đã xóa
        voucherDate,
        stockTakeDate,
        purpose:   purpose   || undefined,
        member1:   member1   || undefined, position1: position1 || undefined,
        member2:   member2   || undefined, position2: position2 || undefined,
        member3:   member3   || undefined, position3: position3 || undefined,
        createdBy: createdBy || undefined,
        stockTakeDetails,
      });
      router.push(`/dashboard/stock-take/${result.stockTakeVoucherId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi lưu phiếu");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: FONT, fontSize: 14, color: "#1e293b" }}>

      {/* ── Hero banner ── */}
      <div style={{ ...s.heroBanner, justifyContent: "flex-start", gap: 20 }}>
        <div style={s.heroOrb} /><div style={s.heroOrb2} />
        <button style={s.backBtn} onClick={() => router.push("/dashboard/stock-take")}>← Quay lại</button>
        <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
          <div style={s.heroEyebrow}>Kiểm kê kho</div>
          <h1 style={s.heroTitle}>Thêm mới phiếu kiểm kê</h1>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 8 }}>
          <button style={s.btnGhost} onClick={() => router.push("/dashboard/stock-take")}>Huỷ</button>
          <button style={s.btnSave} onClick={handleSaveClick} disabled={saving}>
            {saving ? "⏳ Đang lưu..." : "💾 Lưu phiếu kiểm kê"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Thông tin phiếu ── */}
        <section style={s.card}>
          <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin phiếu kiểm kê</h3>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 150px 150px", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={s.lbl}>Số phiếu KK</label>
              <input style={{ ...s.inp, background: "#f8fafc", color: previewCode ? "#6d28d9" : "#94a3b8", fontWeight: previewCode ? 700 : 400, fontStyle: previewCode ? "normal" : "italic" }}
                value={previewCode} readOnly placeholder="Đang tải..." />
            </div>
            <div>
              <label style={s.lbl}>Người lập phiếu</label>
              <input style={{ ...s.inp, background: "#f8fafc", color: "#475569" }}
                value={createdBy} readOnly placeholder="(từ tài khoản đăng nhập)" />
            </div>
            <div>
              <label style={s.lbl}>Ngày lập <span style={{ color: "#e53e3e" }}>*</span></label>
              <input type="date" style={s.inp} value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)} />
            </div>
            <div>
              <label style={s.lbl}>Ngày kiểm kê <span style={{ color: "#e53e3e" }}>*</span></label>
              <input type="date" style={s.inp} value={stockTakeDate}
                onChange={(e) => handleStockTakeDateChange(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>Diễn giải / Mục đích</label>
            <input style={s.inp} placeholder="VD: Kiểm kê định kỳ cuối tháng..."
              value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div>
            <div style={s.sectionSub}>Thành phần tham gia</div>
            <MemberPanel
              member1={member1}   setMember1={setMember1}   position1={position1} setPosition1={setPosition1}
              member2={member2}   setMember2={setMember2}   position2={position2} setPosition2={setPosition2}
              member3={member3}   setMember3={setMember3}   position3={position3} setPosition3={setPosition3}
              inputStyle={s.inp}
            />
          </div>
        </section>

        {/* ── Tab Hàng hóa | Chưa kiểm ── */}
        <section style={s.card}>
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 4 }}>
            {([
              { key: "goods"     as const, label: "Hàng hóa",  count: lines.length },
              { key: "unchecked" as const, label: "Chưa kiểm", count: uncheckedRows.length, warn: uncheckedRows.length > 0 },
            ]).map((tab) => {
              const isActive = activeTab === tab.key;
              const color    = tab.warn ? "#d97706" : "#6d28d9";
              return (
                <button key={tab.key}
                  style={{
                    padding: "10px 18px", border: "none", background: "transparent",
                    cursor: "pointer", fontSize: 13,
                    borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                    color: isActive ? color : "#64748b",
                    fontWeight: isActive ? 700 : 500, marginBottom: -1,
                  }}
                  onClick={() => { setActiveTab(tab.key); setKeyword(""); setUncheckedPage(1); }}>
                  {tab.label}
                  <span style={{
                    marginLeft: 6, padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: isActive ? (tab.warn ? "#fffbeb" : "#ede9fe") : "#f1f5f9",
                    color: isActive ? color : "#94a3b8",
                  }}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div style={{ display: !goodsLoading ? "flex" : "none", alignItems: "center", padding: "12px 0 8px", gap: 8 }}>
            {activeTab === "goods" && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...s.inp, width: 280, height: 36, paddingLeft: 12 }}
                    placeholder="🔍 Tìm hàng để thêm vào phiếu..."
                    value={addKeyword}
                    onChange={(e) => { setAddKeyword(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                  />
                  {showDropdown && !goodsLoading && dropdownGoods.length > 0 && (
                    <div style={s.dropdown}>
                      {dropdownGoods.map((g) => (
                        <div key={g.goodsId} style={s.dropItem} onMouseDown={() => pickGoods(g)}>
                          <span style={{ fontFamily: "monospace", color: "#6d28d9", width: 90, flexShrink: 0, fontSize: 12 }}>{g.goodsId}</span>
                          <span style={{ flex: 1, fontSize: 13 }}>{g.goodsName}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>{g.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button style={s.addRowBtn} onClick={addBlankRow}>+ Dòng trống</button>
              </div>
            )}
            <div style={{ position: "relative", width: 280, height: 36, border: "1.5px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", marginLeft: "auto" }}>
              <span style={{ position: "absolute", left: 9, fontSize: 12, color: "#94a3b8" }}>🔍</span>
              <input
                style={{ border: "none", outline: "none", background: "transparent", paddingLeft: 28, width: "100%", fontSize: 13 }}
                placeholder="Lọc mã hàng, tên hàng..." value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setUncheckedPage(1); }}
              />
            </div>
          </div>

          {/* Loading khi đang tải hàng hóa */}
          {goodsLoading && (
            <div style={{ padding: "36px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              ⏳ Đang tải danh sách hàng hóa...
            </div>
          )}

          {/* ══ Bảng Tab HÀNG HÓA ══ */}
          {activeTab === "goods" && !goodsLoading && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)" }}>
                    <th style={{ ...s.th2, width: 120 }}>Mã hàng hóa</th>
                    <th style={s.th2}>Tên hàng hóa</th>
                    <th style={{ ...s.th2, width: 70, textAlign: "center" }}>ĐVT</th>
                    <th style={{ ...s.th2, width: 110, textAlign: "right" }}>SL tồn kho</th>
                    <th style={{ ...s.th2, width: 130, textAlign: "right" }}>SL thực tế</th>
                    <th style={{ ...s.th2, width: 105, textAlign: "right" }}>Chênh lệch</th>
                    <th style={{ ...s.th2, width: 100, textAlign: "center" }}>Xử lý</th>
                    <th style={{ ...s.th2, width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLines.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: "36px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      {lines.length === 0
                        ? <><div style={{ fontSize: 28, marginBottom: 8 }}>📦</div><div>Tìm và chọn hàng hóa để thêm vào phiếu kiểm kê</div></>
                        : "Không tìm thấy hàng hóa phù hợp"}
                    </td></tr>
                  )}
                  {visibleLines.map((line, i) => {
                    const diff = line.actualQuantity - line.bookQuantity;
                    const xuLy = getXuLy(line);
                    return (
                      <tr key={line._id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff", borderTop: "1px solid #f1f5f9" }}>
                        <td style={s.td2}>
                          <input
                            style={{ ...s.cellInp, background: line._locked ? "#f8fafc" : "#fff", color: line._locked ? "#475569" : "#1e293b" }}
                            value={line.goodsId} readOnly={line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "goodsId", e.target.value)}
                          />
                        </td>
                        <td style={s.td2}>
                          <input
                            style={{ ...s.cellInp, background: line._locked ? "#f8fafc" : "#fff", color: line._locked ? "#475569" : "#1e293b" }}
                            value={line.goodsName} readOnly={line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "goodsName", e.target.value)}
                          />
                        </td>
                        <td style={s.td2}>
                          <input
                            style={{ ...s.cellInp, textAlign: "center", background: line._locked ? "#f8fafc" : "#fff" }}
                            value={line.unit ?? ""} readOnly={line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "unit", e.target.value)}
                          />
                        </td>
                        {/* SL tồn kho — chỉ đọc, không gửi lên backend */}
                        <td style={{ ...s.td2, textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                          {fmtNum(line.bookQuantity)}
                        </td>
                        <td style={s.td2}>
                          <input type="number" min={0}
                            style={{
                              ...s.cellInp, textAlign: "right",
                              fontWeight: line._touched ? 700 : 400,
                              color: !line._touched ? "#94a3b8" : diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#1e293b",
                              border: !line._touched ? "1px dashed #cbd5e1" : diff !== 0 ? `1.5px solid ${diff > 0 ? "#86efac" : "#fca5a5"}` : "1px solid #e2e8f0",
                              background: !line._touched ? "#f8fafc" : "#fff",
                            }}
                            value={line.actualQuantity}
                            onChange={(e) => updateActual(line._id, e.target.value)}
                          />
                        </td>
                        <td style={{
                          ...s.td2, textAlign: "right", fontWeight: 700,
                          color: !line._touched ? "#1d4ed8" : diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#1d4ed8",
                        }}>
                          {!line._touched ? "Khớp" : diff === 0 ? "Khớp" : (diff > 0 ? "+" : "") + fmtNum(diff)}
                        </td>
                        <td style={{ ...s.td2, textAlign: "center" }}>
                          {xuLy ? (
                            <span style={{
                              display: "inline-block", padding: "2px 10px", borderRadius: 20,
                              fontSize: 11, fontWeight: 700,
                              color: xuLy.color, background: xuLy.bg, border: `1px solid ${xuLy.border}`,
                            }}>
                              {xuLy.label}
                            </span>
                          ) : <span style={{ color: "#cbd5e1", fontSize: 12 }}>--</span>}
                        </td>
                        <td style={{ ...s.td2, textAlign: "center" }}>
                          <button
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16 }}
                            onClick={() => removeRow(line._id)}>×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {visibleLines.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #e2e8f0" }}>
                      <td colSpan={3} style={{ ...s.td2, textAlign: "right", fontSize: 12, color: "#64748b" }}>
                        Tổng ({visibleLines.length} dòng):
                      </td>
                      <td style={{ ...s.td2, textAlign: "right", fontFamily: "monospace" }}>
                        {fmtNum(visibleLines.reduce((a, l) => a + l.bookQuantity, 0))}
                      </td>
                      <td style={{ ...s.td2, textAlign: "right", fontFamily: "monospace" }}>
                        {fmtNum(visibleLines.reduce((a, l) => a + l.actualQuantity, 0))}
                      </td>
                      <td style={{
                        ...s.td2, textAlign: "right", fontWeight: 700,
                        color: (() => {
                          const d = visibleLines.reduce((a, l) => a + (l.actualQuantity - l.bookQuantity), 0);
                          return d > 0 ? "#16a34a" : d < 0 ? "#dc2626" : "#1d4ed8";
                        })(),
                      }}>
                        {(() => {
                          const d = visibleLines.reduce((a, l) => a + (l.actualQuantity - l.bookQuantity), 0);
                          return d === 0 ? "Khớp" : (d > 0 ? "+" : "") + fmtNum(d);
                        })()}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* ══ Bảng Tab CHƯA KIỂM ══ */}
          {activeTab === "unchecked" && !goodsLoading && (
            <>
              {filteredUnchecked.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                  <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 15 }}>Tất cả hàng hóa đã được kiểm kê</div>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Không còn mặt hàng nào chưa kiểm</div>
                </div>
              ) : (
                <>
                  {/* Summary bar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px 8px", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 14px", fontSize: 12 }}>
                        <span style={{ color: "#92400e", fontWeight: 600 }}>Chưa kiểm: </span>
                        <strong style={{ color: "#d97706" }}>{filteredUnchecked.length}</strong>
                        {keyword && filteredUnchecked.length !== uncheckedRows.length && (
                          <span style={{ color: "#94a3b8" }}> / {uncheckedRows.length}</span>
                        )}
                        <span style={{ color: "#92400e" }}> mặt hàng</span>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 12 }}>
                        <span style={{ color: "#64748b", fontWeight: 600 }}>Tổng SL tồn: </span>
                        <strong style={{ color: "#1e293b", fontFamily: "monospace" }}>
                          {fmtNum(filteredUnchecked.reduce((a, g) => a + g.stockQuantity, 0))}
                        </strong>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {(safeUncheckedPage - 1) * UNCHECKED_PAGE_SIZE + 1}–{Math.min(safeUncheckedPage * UNCHECKED_PAGE_SIZE, filteredUnchecked.length)} / {filteredUnchecked.length}
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)" }}>
                          <th style={{ ...s.th2, width: 36, textAlign: "center" }}>#</th>
                          <th style={{ ...s.th2, width: 130 }}>Mã hàng hóa</th>
                          <th style={s.th2}>Tên hàng hóa</th>
                          <th style={{ ...s.th2, width: 80, textAlign: "center" }}>ĐVT</th>
                          <th style={{ ...s.th2, width: 130, textAlign: "right" }}>SL tồn kho</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleUnchecked.map((g, i) => {
                          const rowNum = (safeUncheckedPage - 1) * UNCHECKED_PAGE_SIZE + i + 1;
                          return (
                            <tr key={g.goodsId} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff", borderTop: "1px solid #f1f5f9" }}>
                              <td style={{ ...s.td2, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>{rowNum}</td>
                              <td style={{ ...s.td2, fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#6d28d9" }}>{g.goodsId}</td>
                              <td style={{ ...s.td2, color: "#1e293b" }}>{g.goodsName}</td>
                              <td style={{ ...s.td2, textAlign: "center", fontSize: 12, color: "#64748b" }}>{g.unit ?? "--"}</td>
                              <td style={{ ...s.td2, textAlign: "right", fontFamily: "monospace", color: "#475569", fontWeight: 600 }}>{fmtNum(g.stockQuantity)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {uncheckedTotalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px 0 4px" }}>
                      <button style={s.pageBtn} disabled={safeUncheckedPage <= 1} onClick={() => setUncheckedPage(1)}>⟨⟨</button>
                      <button style={s.pageBtn} disabled={safeUncheckedPage <= 1} onClick={() => setUncheckedPage((p) => p - 1)}>⟨</button>
                      {Array.from({ length: uncheckedTotalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === uncheckedTotalPages || Math.abs(p - safeUncheckedPage) <= 1)
                        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === "..." ? (
                            <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "#94a3b8" }}>…</span>
                          ) : (
                            <button key={p} style={{ ...s.pageBtn, ...(p === safeUncheckedPage ? s.pageBtnActive : {}) }}
                              onClick={() => setUncheckedPage(p as number)}>
                              {p}
                            </button>
                          )
                        )}
                      <button style={s.pageBtn} disabled={safeUncheckedPage >= uncheckedTotalPages} onClick={() => setUncheckedPage((p) => p + 1)}>⟩</button>
                      <button style={s.pageBtn} disabled={safeUncheckedPage >= uncheckedTotalPages} onClick={() => setUncheckedPage(uncheckedTotalPages)}>⟩⟩</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Error + Bottom bar */}
        {error && !showWarning && (
          <div style={{ padding: "10px 16px", background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            💡 Tìm và chọn hàng hóa, nhập <strong>SL thực tế</strong> — chênh lệch & cột xử lý tự tính.
            Dòng chưa nhập hiện ở tab <strong>Chưa kiểm</strong>.
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.btnGhostDark} onClick={() => router.push("/dashboard/stock-take")}>Huỷ</button>
            <button style={s.btnSave} onClick={handleSaveClick} disabled={saving}>
              {saving ? "⏳ Đang lưu..." : "💾 Lưu"}
            </button>
          </div>
        </div>
      </div>

      {pendingDate && (
        <div style={m.overlay}>
          <div style={{ ...m.box, maxWidth: 420, width: "100%", padding: 0 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
                ⚠️ Thay đổi ngày kiểm kê
              </div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Bạn đã nhập dữ liệu kiểm kê. Thay đổi ngày sẽ <strong style={{ color: "#dc2626" }}>xóa toàn bộ số lượng thực tế</strong> đã nhập.
                <br />Bạn có chắc muốn tiếp tục?
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 22px" }}>
              <button style={m.btnSec} onClick={() => setPendingDate(null)}>Hủy</button>
              <button
                style={{ ...m.btnWarn, background: "linear-gradient(135deg,#dc2626,#ef4444)" }}
                onClick={confirmDateChange}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarning && (
        <UncheckedWarningModal
          rows={uncheckedRows}
          onClose={() => { setShowWarning(false); setError(""); }}
          onContinue={() => { setShowWarning(false); doSave(); }}
          saveError={error}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  heroBanner: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #3b82f6 100%)", borderRadius: 14, padding: "20px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 8px 24px rgba(109,40,217,0.28)" },
  heroOrb:    { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2:   { position: "absolute", bottom: -30, left: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 3 },
  heroTitle:   { fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 },
  backBtn:    { position: "relative", zIndex: 1, height: 34, padding: "0 14px", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const },
  btnGhost:   { height: 34, padding: "0 16px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnGhostDark: { height: 36, padding: "0 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnSave:    { height: 36, padding: "0 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#6d28d9,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  card:       { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  cardTitle:  { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16, marginTop: 0 },
  titleDot:   { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", flexShrink: 0 },
  sectionSub: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10 },
  lbl:        { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 },
  inp:        { width: "100%", height: 36, padding: "0 11px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const, color: "#1e293b", background: "#fff" },
  th2:        { padding: "10px 12px", textAlign: "left" as const, fontWeight: 700, color: "#fff", fontSize: 12, whiteSpace: "nowrap" as const },
  td2:        { padding: "6px 10px", verticalAlign: "middle" as const, borderBottom: "1px solid #f1f5f9" },
  cellInp:    { width: "100%", height: 30, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  addRowBtn:  { height: 36, padding: "0 14px", border: "1.5px solid #7c3aed", borderRadius: 8, background: "#ede9fe", color: "#6d28d9", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const },
  dropdown:    { position: "absolute" as const, top: "calc(100% + 4px)", left: 0, minWidth: 480, zIndex: 9999, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" as const },
  dropItem:    { display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13, whiteSpace: "nowrap" as const },
  pageBtn:     { height: 28, minWidth: 28, padding: "0 8px", border: "1.5px solid #e2e8f0", borderRadius: 6, background: "#fff", color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  pageBtnActive: { background: "linear-gradient(135deg,#6d28d9,#4f46e5)", color: "#fff", border: "1.5px solid #6d28d9" },
};

const m: Record<string, React.CSSProperties> = {
  overlay:  { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" },
  box:      { background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", overflowY: "auto" as const },
  head:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #fde68a", background: "#fffbeb" },
  title:    { fontSize: 14, fontWeight: 700, color: "#92400e" },
  closeBtn: { width: 26, height: 26, border: "none", background: "#fef3c7", color: "#92400e", borderRadius: 6, cursor: "pointer" },
  th:       { padding: "7px 10px", fontWeight: 600, fontSize: 11, textAlign: "left" as const, color: "#92400e" },
  td:       { padding: "6px 10px", verticalAlign: "middle" as const, fontSize: 12 },
  btnSec:   { height: 34, padding: "0 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnWarn:  { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
};