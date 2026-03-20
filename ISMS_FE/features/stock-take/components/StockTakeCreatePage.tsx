// features/stock-take/components/StockTakeCreatePage.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllGoods, createStockTake, getStockTakeList } from "../stockTake.api";
import type { GoodsDto, CreateStockTakeDetailRequest } from "../types/stockTake.types";
import { MemberPanel } from "./MemberPanel";

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

const fmtNum = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

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

async function generateVoucherCode(): Promise<string> {
  try {
    const items = await getStockTakeList();
    let max = 0;
    for (const item of items) {
      const match = item.voucherCode.match(/^KK(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    }
    return `KK${String(max + 1).padStart(6, "0")}`;
  } catch {
    return `KK${String(Date.now()).slice(-6)}`;
  }
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
  return null;
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
            Những mặt hàng dưới đây chưa được nhập số lượng thực tế. Bạn muốn quay lại kiểm hay lưu luôn?
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

  const [voucherCode,   setVoucherCode]   = useState("");
  const [createdBy,     setCreatedBy]     = useState("");
  const [voucherDate,   setVoucherDate]   = useState(today);
  const [stockTakeDate, setStockTakeDate] = useState(today);
  const [purpose,       setPurpose]       = useState("");
  const [member1, setMember1] = useState(""); const [position1, setPosition1] = useState("");
  const [member2, setMember2] = useState(""); const [position2, setPosition2] = useState("");
  const [member3, setMember3] = useState(""); const [position3, setPosition3] = useState("");

  const [lines,        setLines]        = useState<LineRow[]>([]);
  const [allGoods,     setAllGoods]     = useState<GoodsDto[]>([]);
  const [goodsLoading, setGoodsLoading] = useState(true);
  const [idCounter,    setIdCounter]    = useState(1);
  const [activeTab,    setActiveTab]    = useState<"goods" | "unchecked">("goods");
  const [keyword,      setKeyword]      = useState("");
  const [saving,       setSaving]       = useState(false);
  const [showWarning,  setShowWarning]  = useState(false);
  const [error,        setError]        = useState("");
  const [addKeyword,   setAddKeyword]   = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setCreatedBy(getNameFromToken());
    Promise.all([generateVoucherCode(), getAllGoods()])
      .then(([code, goods]) => { setVoucherCode(code); setAllGoods(goods); })
      .catch(() => {})
      .finally(() => setGoodsLoading(false));
  }, []);

  const dropdownGoods = useMemo(() => {
    if (!addKeyword.trim()) return allGoods.slice(0, 20);
    const kw = addKeyword.toLowerCase();
    return allGoods.filter((g) => g.goodsId.toLowerCase().includes(kw) || g.goodsName.toLowerCase().includes(kw)).slice(0, 20);
  }, [allGoods, addKeyword]);

  const pickGoods = (g: GoodsDto) => {
    if (lines.some((l) => l.goodsId === g.goodsId)) { setAddKeyword(""); setShowDropdown(false); return; }
    setLines((prev) => [...prev, { _id: idCounter, _touched: false, _locked: true, goodsId: g.goodsId, goodsName: g.goodsName, unit: g.unit, bookQuantity: g.stockQuantity, actualQuantity: g.stockQuantity }]);
    setIdCounter((c) => c + 1);
    setAddKeyword(""); setShowDropdown(false);
  };

  const addBlankRow = () => {
    setLines((prev) => [...prev, { _id: idCounter, _touched: false, _locked: false, goodsId: "", goodsName: "", unit: "", bookQuantity: 0, actualQuantity: 0 }]);
    setIdCounter((c) => c + 1);
  };

  const updateActual = (id: number, val: string) =>
    setLines((prev) => prev.map((l) => l._id === id ? { ...l, actualQuantity: Math.max(0, parseInt(val || "0", 10) || 0), _touched: true } : l));

  const updateField = (id: number, field: string, value: string | number) =>
    setLines((prev) => prev.map((l) => (l._id === id ? { ...l, [field]: value } : l)));

  const removeRow = (id: number) => setLines((prev) => prev.filter((l) => l._id !== id));

  const checkedIds    = useMemo(() => new Set(lines.filter((l) => l._touched).map((l) => l.goodsId)), [lines]);
  const uncheckedRows = useMemo(() => allGoods.filter((g) => !checkedIds.has(g.goodsId)), [allGoods, checkedIds]);

  const visibleLines = useMemo(() => {
    if (!keyword) return lines;
    const kw = keyword.toLowerCase();
    return lines.filter((l) => l.goodsId.toLowerCase().includes(kw) || l.goodsName.toLowerCase().includes(kw));
  }, [lines, keyword]);

  const visibleUnchecked = useMemo(() => {
    if (!keyword) return uncheckedRows;
    const kw = keyword.toLowerCase();
    return uncheckedRows.filter((g) => g.goodsId.toLowerCase().includes(kw) || g.goodsName.toLowerCase().includes(kw));
  }, [uncheckedRows, keyword]);

  const handleSaveClick = () => {
    if (!voucherDate || !stockTakeDate) { setError("Vui lòng điền đầy đủ ngày"); return; }
    setError("");
    if (uncheckedRows.length > 0) { setShowWarning(true); return; }
    doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const stockTakeDetails: CreateStockTakeDetailRequest[] = lines.map(({ _id, _touched, _locked, ...rest }) => rest);
      const result = await createStockTake({
        voucherCode: voucherCode || undefined,
        voucherDate, stockTakeDate,
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
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 150px 150px", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={s.lbl}>Số phiếu KK</label>
              <input style={{ ...s.inp, fontWeight: 700, color: voucherCode ? "#6d28d9" : "#94a3b8", fontFamily: "monospace" }}
                value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="KK000001" />
            </div>
            <div>
              <label style={s.lbl}>Người lập phiếu</label>
              <input style={{ ...s.inp, background: "#f8fafc", color: "#475569" }} value={createdBy} readOnly placeholder="(từ tài khoản đăng nhập)" />
            </div>
            <div>
              <label style={s.lbl}>Ngày lập <span style={{ color: "#e53e3e" }}>*</span></label>
              <input type="date" style={s.inp} value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
            </div>
            <div>
              <label style={s.lbl}>Ngày kiểm kê <span style={{ color: "#e53e3e" }}>*</span></label>
              <input type="date" style={s.inp} value={stockTakeDate} onChange={(e) => setStockTakeDate(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>Diễn giải / Mục đích</label>
            <input style={s.inp} placeholder="VD: Kiểm kê định kỳ cuối tháng..." value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div>
            <div style={s.sectionSub}>Thành phần tham gia</div>
            <MemberPanel
              member1={member1} setMember1={setMember1} position1={position1} setPosition1={setPosition1}
              member2={member2} setMember2={setMember2} position2={position2} setPosition2={setPosition2}
              member3={member3} setMember3={setMember3} position3={position3} setPosition3={setPosition3}
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
                  style={{ padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13,
                    borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                    color: isActive ? color : "#64748b", fontWeight: isActive ? 700 : 500, marginBottom: -1 }}
                  onClick={() => { setActiveTab(tab.key); setKeyword(""); }}>
                  {tab.label}
                  <span style={{ marginLeft: 6, padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: isActive ? (tab.warn ? "#fffbeb" : "#ede9fe") : "#f1f5f9",
                    color: isActive ? color : "#94a3b8" }}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", padding: "12px 0 8px", gap: 8 }}>
            {activeTab === "goods" && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ position: "relative" }}>
                  <input style={{ ...s.inp, width: 280, height: 36, paddingLeft: 12 }}
                    placeholder="🔍 Tìm hàng để thêm vào phiếu..."
                    value={addKeyword}
                    onChange={(e) => { setAddKeyword(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 180)} />
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
              <input style={{ border: "none", outline: "none", background: "transparent", paddingLeft: 28, width: "100%", fontSize: 13 }}
                placeholder="Lọc mã hàng, tên hàng..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
          </div>

          {/* ══ Bảng Tab HÀNG HÓA ══ */}
          {activeTab === "goods" && (
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
                          <input style={{ ...s.cellInp, background: line._locked ? "#f8fafc" : "#fff", color: line._locked ? "#475569" : "#1e293b" }}
                            value={line.goodsId} readOnly={line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "goodsId", e.target.value)} />
                        </td>
                        <td style={s.td2}>
                          <input style={{ ...s.cellInp, background: line._locked ? "#f8fafc" : "#fff", color: line._locked ? "#475569" : "#1e293b" }}
                            value={line.goodsName} readOnly={line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "goodsName", e.target.value)} />
                        </td>
                        <td style={s.td2}>
                          <input style={{ ...s.cellInp, textAlign: "center", background: line._locked ? "#f8fafc" : "#fff" }}
                            value={line.unit ?? ""} readOnly={line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "unit", e.target.value)} />
                        </td>
                        <td style={{ ...s.td2, textAlign: "right", color: "#475569", fontFamily: "monospace" }}>{fmtNum(line.bookQuantity)}</td>
                        <td style={s.td2}>
                          <input type="number" min={0}
                            style={{ ...s.cellInp, textAlign: "right",
                              fontWeight: line._touched ? 700 : 400,
                              color: !line._touched ? "#94a3b8" : diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#1e293b",
                              border: !line._touched ? "1px dashed #cbd5e1" : diff !== 0 ? `1.5px solid ${diff > 0 ? "#86efac" : "#fca5a5"}` : "1px solid #e2e8f0",
                              background: !line._touched ? "#f8fafc" : "#fff" }}
                            value={line.actualQuantity}
                            onChange={(e) => updateActual(line._id, e.target.value)} />
                        </td>
                        <td style={{ ...s.td2, textAlign: "right", fontWeight: 700,
                          color: !line._touched ? "#cbd5e1" : diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#94a3b8" }}>
                          {!line._touched ? "--" : diff === 0 ? "Khớp" : (diff > 0 ? "+" : "") + fmtNum(diff)}
                        </td>
                        <td style={{ ...s.td2, textAlign: "center" }}>
                          {xuLy ? (
                            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              color: xuLy.color, background: xuLy.bg, border: `1px solid ${xuLy.border}` }}>
                              {xuLy.label}
                            </span>
                          ) : <span style={{ color: "#cbd5e1", fontSize: 12 }}>--</span>}
                        </td>
                        <td style={{ ...s.td2, textAlign: "center" }}>
                          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16 }}
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
                      <td style={{ ...s.td2, textAlign: "right", fontWeight: 700,
                        color: (() => { const d = visibleLines.reduce((a, l) => a + (l.actualQuantity - l.bookQuantity), 0); return d > 0 ? "#16a34a" : d < 0 ? "#dc2626" : "#94a3b8"; })() }}>
                        {(() => { const d = visibleLines.reduce((a, l) => a + (l.actualQuantity - l.bookQuantity), 0); return d === 0 ? "--" : (d > 0 ? "+" : "") + fmtNum(d); })()}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* ══ Bảng Tab CHƯA KIỂM ══ */}
          {activeTab === "unchecked" && (
            <div style={{ border: "1px solid #fde68a", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }}>
                    <th style={{ ...s.th2, width: 130 }}>Mã hàng hóa</th>
                    <th style={s.th2}>Tên hàng hóa</th>
                    <th style={{ ...s.th2, width: 80, textAlign: "center" }}>ĐVT</th>
                    <th style={{ ...s.th2, width: 130, textAlign: "right" }}>SL tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUnchecked.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: "36px 0", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                      <div style={{ color: "#16a34a", fontWeight: 600 }}>Tất cả hàng hóa đã được kiểm kê</div>
                    </td></tr>
                  )}
                  {visibleUnchecked.map((g, i) => (
                    <tr key={g.goodsId} style={{ background: i % 2 === 0 ? "#fff" : "#fffbeb", borderTop: "1px solid #fde68a" }}>
                      <td style={{ ...s.td2, fontFamily: "monospace", fontSize: 12, color: "#92400e" }}>{g.goodsId}</td>
                      <td style={{ ...s.td2, color: "#475569" }}>{g.goodsName}</td>
                      <td style={{ ...s.td2, textAlign: "center", fontSize: 12, color: "#64748b" }}>{g.unit ?? "--"}</td>
                      <td style={{ ...s.td2, textAlign: "right", fontFamily: "monospace", color: "#475569" }}>{fmtNum(g.stockQuantity)}</td>
                    </tr>
                  ))}
                </tbody>
                {visibleUnchecked.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#fffbeb", fontWeight: 700, borderTop: "2px solid #fde68a" }}>
                      <td colSpan={3} style={{ ...s.td2, textAlign: "right", fontSize: 12, color: "#92400e" }}>
                        Chưa kiểm ({visibleUnchecked.length} mặt hàng):
                      </td>
                      <td style={{ ...s.td2, textAlign: "right", fontFamily: "monospace", color: "#92400e" }}>
                        {fmtNum(visibleUnchecked.reduce((a, g) => a + g.stockQuantity, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
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

      {showWarning && (
        <UncheckedWarningModal rows={uncheckedRows}
          onClose={() => { setShowWarning(false); setError(""); }}
          onContinue={() => { setShowWarning(false); doSave(); }}
          saveError={error} />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  heroBanner: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #3b82f6 100%)",
    borderRadius: 14, padding: "20px 28px", marginBottom: 20,
    display: "flex", alignItems: "center", gap: 16,
    boxShadow: "0 8px 24px rgba(109,40,217,0.28)",
  },
  heroOrb:  { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2: { position: "absolute", bottom: -30, left: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 3 },
  heroTitle:   { fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 },
  backBtn: {
    position: "relative", zIndex: 1, height: 34, padding: "0 14px",
    border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8,
    background: "rgba(255,255,255,0.1)", color: "#fff",
    cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const,
  },
  btnGhost: {
    height: 34, padding: "0 16px", borderRadius: 8,
    border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.1)",
    color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  btnGhostDark: {
    height: 36, padding: "0 16px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", background: "#fff",
    color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  btnSave: {
    height: 36, padding: "0 22px", borderRadius: 8, border: "none",
    background: "linear-gradient(135deg,#6d28d9,#4f46e5)", color: "#fff",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
    padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700,
    color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.06em",
    marginBottom: 16, marginTop: 0,
  },
  titleDot: {
    display: "inline-block", width: 10, height: 10, borderRadius: "50%",
    background: "linear-gradient(135deg,#7c3aed,#6366f1)", flexShrink: 0,
  },
  sectionSub: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10 },
  lbl:   { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 },
  inp:   { width: "100%", height: 36, padding: "0 11px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const, color: "#1e293b", background: "#fff" },
  th2:   { padding: "10px 12px", textAlign: "left" as const, fontWeight: 700, color: "#fff", fontSize: 12, whiteSpace: "nowrap" as const },
  td2:   { padding: "6px 10px", verticalAlign: "middle" as const, borderBottom: "1px solid #f1f5f9" },
  cellInp: { width: "100%", height: 30, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  addRowBtn: { height: 36, padding: "0 14px", border: "1.5px solid #7c3aed", borderRadius: 8, background: "#ede9fe", color: "#6d28d9", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const },
  dropdown:  { position: "absolute" as const, top: "calc(100% + 4px)", left: 0, minWidth: 480, zIndex: 9999, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" as const },
  dropItem:  { display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13, whiteSpace: "nowrap" as const },
};

const m: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" },
  box:     { background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", overflowY: "auto" as const },
  head:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #fde68a", background: "#fffbeb" },
  title:   { fontSize: 14, fontWeight: 700, color: "#92400e" },
  closeBtn:{ width: 26, height: 26, border: "none", background: "#fef3c7", color: "#92400e", borderRadius: 6, cursor: "pointer" },
  th:      { padding: "7px 10px", fontWeight: 600, fontSize: 11, textAlign: "left" as const, color: "#92400e" },
  td:      { padding: "6px 10px", verticalAlign: "middle" as const, fontSize: 12 },
  btnSec:  { height: 34, padding: "0 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnWarn: { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
};