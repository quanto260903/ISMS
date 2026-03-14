// features/stock-take/components/StockTakeCreatePage.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllGoods, createStockTake, getStockTakeList } from "../stockTake.api";
import type { GoodsDto, CreateStockTakeDetailRequest } from "../types/stockTake.types";

// ── Helpers ───────────────────────────────────────────────────
const fmtNum = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function getNameFromToken(): string {
  try {
    const token = localStorage.getItem("token") ?? "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload["name"] ??
      payload["fullName"] ??
      payload["unique_name"] ??
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
      payload["sub"] ?? ""
    );
  } catch { return ""; }
}

async function generateVoucherCode(): Promise<string> {
  try {
    const res = await getStockTakeList({ page: 1, pageSize: 9999 });
    let max = 0;
    for (const item of res.items) {
      const m = item.voucherCode.match(/^KK(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `KK${String(max + 1).padStart(6, "0")}`;
  } catch {
    return `KK${String(Date.now()).slice(-6)}`;
  }
}

// ── Types ─────────────────────────────────────────────────────
interface LineRow {
  _id:            number;
  _touched:       boolean; // true = đã nhập SL thực tế
  _locked?:       boolean; // true = chọn từ dropdown, khóa Mã/Tên/ĐVT
  goodsId:        string;
  goodsName:      string;
  unit:           string | null;
  bookQuantity:   number;
  actualQuantity: number;
}

// "Xử lý" hiển thị ở cột cuối
function getXuLy(line: LineRow): { label: string; color: string; bg: string } | null {
  if (!line._touched) return null;
  const diff = line.actualQuantity - line.bookQuantity;
  if (diff > 0)  return { label: "Nhập kho",  color: "#15803d", bg: "#f0fdf4" };
  if (diff < 0)  return { label: "Xuất kho",  color: "#b91c1c", bg: "#fff1f2" };
  return null; // khớp → không hiện
}

// ── Modal cảnh báo hàng chưa kiểm ────────────────────────────
function UncheckedWarningModal({
  rows, onContinue, onClose, saveError,
}: {
  rows: { goodsId: string; goodsName: string; unit: string | null; stockQuantity: number }[];
  onContinue: () => void;
  onClose: () => void;
  saveError?: string;
}) {
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 540 }} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>⚠️ Còn {rows.length} mặt hàng chưa được kiểm kê</span>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "14px 20px 20px" }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 12, lineHeight: 1.7 }}>
            Những mặt hàng dưới đây chưa được nhập số lượng thực tế.
            Bạn muốn quay lại kiểm hay lưu luôn?
          </p>
          <div style={{ border: "1px solid #fde68a", borderRadius: 8,
            overflow: "hidden", maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fffbeb", position: "sticky" as const, top: 0 }}>
                  <th style={m.th}>Mã hàng</th>
                  <th style={m.th}>Tên hàng hóa</th>
                  <th style={{ ...m.th, textAlign: "center" }}>ĐVT</th>
                  <th style={{ ...m.th, textAlign: "right"  }}>Tồn sách</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.goodsId}
                    style={{ background: i % 2 === 0 ? "#fff" : "#fffbeb", borderTop: "1px solid #fde68a" }}>
                    <td style={m.td}>
                      <span style={{ fontFamily: "monospace", color: "#92400e" }}>{r.goodsId}</span>
                    </td>
                    <td style={m.td}>{r.goodsName}</td>
                    <td style={{ ...m.td, textAlign: "center", color: "#64748b" }}>{r.unit ?? "--"}</td>
                    <td style={{ ...m.td, textAlign: "right", fontFamily: "monospace" }}>
                      {fmtNum(r.stockQuantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {saveError && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fff1f2",
              border: "1px solid #fecaca", borderRadius: 7, color: "#b91c1c", fontSize: 12 }}>
              ⚠️ {saveError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={m.btnSec}  onClick={onClose}>← Quay lại kiểm</button>
            <button style={m.btnWarn} onClick={onContinue}>Lưu luôn</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function StockTakeCreatePage() {
  const router = useRouter();
  const today  = new Date().toISOString().slice(0, 10);

  // ── Header ─────────────────────────────────────────────────
  const [voucherCode,   setVoucherCode]   = useState("");
  const [createdBy,     setCreatedBy]     = useState("");
  const [voucherDate,   setVoucherDate]   = useState(today);
  const [stockTakeDate, setStockTakeDate] = useState(today);
  const [purpose,       setPurpose]       = useState("");
  const [member1, setMember1] = useState(""); const [position1, setPosition1] = useState("");
  const [member2, setMember2] = useState(""); const [position2, setPosition2] = useState("");
  const [member3, setMember3] = useState(""); const [position3, setPosition3] = useState("");

  // ── Tab hàng hóa: bắt đầu TRỐNG, người dùng tự chọn thêm ──
  const [lines,       setLines]       = useState<LineRow[]>([]);
  // allGoods: danh sách toàn bộ hàng để gợi ý khi người dùng thêm dòng
  const [allGoods,    setAllGoods]    = useState<GoodsDto[]>([]);
  const [goodsLoading,setGoodsLoading]= useState(true);

  // ── UI ─────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState<"goods" | "unchecked">("goods");
  const [keyword,     setKeyword]     = useState("");
  const [saving,      setSaving]      = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [error,       setError]       = useState("");
  // dropdown tìm hàng khi thêm dòng mới
  const [addKeyword,  setAddKeyword]  = useState("");
  const [showDropdown,setShowDropdown]= useState(false);
  const [idCounter,   setIdCounter]   = useState(1);

  // ── Init ────────────────────────────────────────────────────
  useEffect(() => {
    setCreatedBy(getNameFromToken());
    generateVoucherCode().then(setVoucherCode);
    (async () => {
      try { setAllGoods(await getAllGoods()); }
      catch { /* ignore */ }
      finally { setGoodsLoading(false); }
    })();
  }, []);

  // ── Thêm hàng hóa từ dropdown ──────────────────────────────
  const dropdownGoods = useMemo(() => {
    if (!addKeyword.trim()) return allGoods.slice(0, 20);
    const kw = addKeyword.toLowerCase();
    return allGoods
      .filter((g) =>
        g.goodsId.toLowerCase().includes(kw) ||
        g.goodsName.toLowerCase().includes(kw)
      )
      .slice(0, 20);
  }, [allGoods, addKeyword]);

  const pickGoods = (g: GoodsDto) => {
    // Kiểm tra trùng
    if (lines.some((l) => l.goodsId === g.goodsId)) {
      setAddKeyword(""); setShowDropdown(false); return;
    }
    setLines((prev) => [
      ...prev,
      {
        _id:            idCounter,
        _touched:       false,
        _locked:        true,            // khóa Mã hàng / Tên hàng / ĐVT
        goodsId:        g.goodsId,
        goodsName:      g.goodsName,
        unit:           g.unit,
        bookQuantity:   g.stockQuantity,
        actualQuantity: g.stockQuantity, // mặc định = sách, _touched = false
      },
    ]);
    setIdCounter((c) => c + 1);
    setAddKeyword(""); setShowDropdown(false);
  };

  // Thêm dòng trống (nhập tay)
  const addBlankRow = () => {
    setLines((prev) => [
      ...prev,
      { _id: idCounter, _touched: false, goodsId: "", goodsName: "", unit: "", bookQuantity: 0, actualQuantity: 0 },
    ]);
    setIdCounter((c) => c + 1);
  };

  // ── Update actual → đánh dấu touched ───────────────────────
  const updateActual = (id: number, val: string) =>
    setLines((prev) =>
      prev.map((l) =>
        l._id === id ? { ...l, actualQuantity: Math.max(0, parseInt(val || "0", 10) || 0), _touched: true } : l
      )
    );

  const updateField = (id: number, field: string, value: string | number) =>
    setLines((prev) => prev.map((l) => (l._id === id ? { ...l, [field]: value } : l)));

  const removeRow = (id: number) => setLines((prev) => prev.filter((l) => l._id !== id));

  // ── Tab "Chưa kiểm" ─────────────────────────────────────────
  // = toàn bộ allGoods, trừ những goodsId đã được nhập SL thực tế (_touched=true)
  const checkedIds = useMemo(
    () => new Set(lines.filter((l) => l._touched).map((l) => l.goodsId)),
    [lines]
  );
  const uncheckedRows = useMemo(
    () => allGoods.filter((g) => !checkedIds.has(g.goodsId)),
    [allGoods, checkedIds]
  );

  // ── Visible by keyword ──────────────────────────────────────
  // Tab Hàng hóa → filter lines (LineRow[])
  // Tab Chưa kiểm → filter uncheckedRows (GoodsDto[])
  const visibleGoods = useMemo(() => {
    const src = activeTab === "unchecked"
      ? (uncheckedRows as { goodsId: string; goodsName: string }[])
      : (lines         as { goodsId: string; goodsName: string }[]);
    if (!keyword) return src;
    const kw = keyword.toLowerCase();
    return src.filter(
      (l) => l.goodsId.toLowerCase().includes(kw) || l.goodsName.toLowerCase().includes(kw)
    );
  }, [lines, uncheckedRows, activeTab, keyword]);

  // ── Save ────────────────────────────────────────────────────
  const handleSaveClick = () => {
    if (!voucherDate || !stockTakeDate) { setError("Vui lòng điền đầy đủ ngày"); return; }
    setError("");
    if (uncheckedRows.length > 0) { setShowWarning(true); return; }
    doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const result = await createStockTake({
        voucherDate,
        stockTakeDate,
        purpose:   purpose   || undefined,
        member1:   member1   || undefined, position1: position1 || undefined,
        member2:   member2   || undefined, position2: position2 || undefined,
        member3:   member3   || undefined, position3: position3 || undefined,
        createdBy: createdBy || undefined,
        stockTakeDetails: lines.map(({ _id, _touched, ...rest }) => rest),
      });
      router.push(`/dashboard/stock-take/${result.stockTakeVoucherId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi lưu phiếu");
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* ── Sticky top bar ── */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => router.push("/dashboard/stock-take")}>
          ← Quay lại
        </button>
        <h1 style={s.pageTitle}>Thêm mới phiếu kiểm kê</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.btnSecondary} onClick={() => router.push("/dashboard/stock-take")}>Huỷ</button>
          <button style={s.btnPrimary} onClick={handleSaveClick} disabled={saving}>
            {saving ? "⏳ Đang lưu..." : "💾 Lưu"}
          </button>
        </div>
      </div>

      <div style={s.body}>

        {/* ════════════════════════════════════════════════════
            PHẦN TRÊN: Thông tin phiếu
            ════════════════════════════════════════════════════ */}
        <div style={s.card}>
          {/* Row 1: Số phiếu | Người lập | Ngày lập | Ngày kiểm */}
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 150px 150px", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={s.lbl}>Số phiếu KK</label>
              {/* Tự sinh nhưng vẫn cho sửa */}
              <input
                style={{ ...s.inp, fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace",
                  background: voucherCode ? "#fff" : "#f8fafc" }}
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="KK000001"
              />
            </div>
            <div>
              <label style={s.lbl}>Người lập phiếu</label>
              <input
                style={{ ...s.inp, background: "#f8fafc", color: "#475569" }}
                value={createdBy}
                readOnly
                placeholder="(lấy từ tài khoản đăng nhập)"
              />
            </div>
            <div>
              <label style={s.lbl}>Ngày lập <span style={{ color: "#e53e3e" }}>*</span></label>
              <input type="date" style={s.inp} value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)} />
            </div>
            <div>
              <label style={s.lbl}>Ngày kiểm kê <span style={{ color: "#e53e3e" }}>*</span></label>
              <input type="date" style={s.inp} value={stockTakeDate}
                onChange={(e) => setStockTakeDate(e.target.value)} />
            </div>
          </div>

          {/* Row 2: Diễn giải */}
          <div style={{ marginBottom: 14 }}>
            <label style={s.lbl}>Diễn giải</label>
            <input style={s.inp} placeholder="VD: Kiểm kê định kỳ cuối tháng..."
              value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>

          {/* Row 3: Thành phần tham gia — giữ nguyên như cũ */}
          <div>
            <div style={s.sectionSub}>Thành phần tham gia</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px 16px" }}>
              {([
                { mv: member1, pv: position1, sm: setMember1, sp: setPosition1, idx: 1 },
                { mv: member2, pv: position2, sm: setMember2, sp: setPosition2, idx: 2 },
                { mv: member3, pv: position3, sm: setMember3, sp: setPosition3, idx: 3 },
              ] as const).map(({ mv, pv, sm, sp, idx }) => (
                <div key={idx}>
                  <input style={{ ...s.inp, marginBottom: 4 }}
                    placeholder={`Thành viên ${idx}`}
                    value={mv} onChange={(e) => sm(e.target.value)} />
                  <input style={{ ...s.inp, height: 30, fontSize: 12 }}
                    placeholder={`Chức vụ ${idx}`}
                    value={pv} onChange={(e) => sp(e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            PHẦN DƯỚI: Tab Hàng hóa | Chưa kiểm
            ════════════════════════════════════════════════════ */}
        <div style={s.card}>
          {/* Tab bar */}
          <div style={s.tabBar}>
            {([ 
              { key: "goods"     as const, label: "Hàng hóa",  count: lines.length          },
              { key: "unchecked" as const, label: "Chưa kiểm", count: uncheckedRows.length,
                warn: uncheckedRows.length > 0 },
            ]).map((tab) => {
              const isActive = activeTab === tab.key;
              const color    = tab.warn ? "#d97706" : "#2563eb";
              return (
                <button key={tab.key}
                  style={{
                    ...s.tabBtn,
                    borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                    color:        isActive ? color : "#64748b",
                    fontWeight:   isActive ? 700 : 500,
                  }}
                  onClick={() => { setActiveTab(tab.key); setKeyword(""); }}
                >
                  {tab.label}
                  <span style={{
                    marginLeft: 5, padding: "1px 7px", borderRadius: 20, fontSize: 11,
                    background: isActive ? (tab.warn ? "#fffbeb" : "#eff6ff") : "#f1f5f9",
                    color:      isActive ? color : "#94a3b8",
                    fontWeight: 700,
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toolbar — dropdown thêm hàng bên TRÁI để mở xuống không tràn phải */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 0 8px", gap: 8 }}>

            {/* TRÁI: Dropdown tìm & chọn hàng — chỉ ở tab Hàng hóa */}
            {activeTab === "goods" && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...s.inp, width: 260, height: 30, paddingLeft: 10 }}
                    placeholder="🔍 Tìm hàng để thêm..."
                    value={addKeyword}
                    onChange={(e) => { setAddKeyword(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                  />
                  {/* left:0 → dropdown neo bên trái, mở sang phải, không bị tràn */}
                  {showDropdown && !goodsLoading && dropdownGoods.length > 0 && (
                    <div style={{ ...s.dropdown, left: 0, right: "auto" }}>
                      {dropdownGoods.map((g) => (
                        <div key={g.goodsId} style={s.dropdownItem}
                          onMouseDown={() => pickGoods(g)}>
                          <span style={{ fontFamily: "monospace", color: "#1d4ed8", width: 90, flexShrink: 0, fontSize: 12 }}>
                            {g.goodsId}
                          </span>
                          <span style={{ flex: 1, fontSize: 13 }}>{g.goodsName}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8, flexShrink: 0 }}>{g.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button style={s.addRowBtn} onClick={addBlankRow} title="Thêm dòng trống">
                  + Dòng trống
                </button>
              </div>
            )}

            {/* PHẢI: Search filter — marginLeft auto đẩy sang phải */}
            <div style={{ position: "relative", width: 280, height: 32,
              border: "1.5px solid #e2e8f0", borderRadius: 8, display: "flex",
              alignItems: "center", marginLeft: "auto" }}>
              <span style={{ position: "absolute", left: 9, fontSize: 12, color: "#94a3b8" }}>🔍</span>
              <input style={{ border: "none", outline: "none", background: "transparent",
                paddingLeft: 28, width: "100%", fontSize: 13 }}
                placeholder="Tìm mã hàng, tên hàng..."
                value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
          </div>

          {/* ══ Bảng Tab HÀNG HÓA ══ */}
          {activeTab === "goods" && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ ...s.th, textAlign: "left",   width: 120 }}>Mã hàng hóa</th>
                    <th style={{ ...s.th, textAlign: "left"             }}>Tên hàng hóa</th>
                    <th style={{ ...s.th, textAlign: "center", width: 75 }}>ĐVT</th>
                    <th style={{ ...s.th, textAlign: "right",  width: 115 }}>SL tồn kho</th>
                    <th style={{ ...s.th, textAlign: "right",  width: 130 }}>SL tồn thực tế</th>
                    <th style={{ ...s.th, textAlign: "right",  width: 105 }}>Chênh lệch</th>
                    <th style={{ ...s.th, textAlign: "center", width: 110 }}>Xử lý</th>
                    <th style={{ ...s.th, width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleGoods.length === 0 && (
                    <tr><td colSpan={8} style={s.emptyCell}>
                      {lines.length === 0
                        ? <><div style={{ fontSize: 28, marginBottom: 6 }}>📦</div>
                            <div>Tìm và chọn hàng hóa để thêm vào phiếu kiểm kê</div></>
                        : "Không tìm thấy hàng hóa phù hợp"}
                    </td></tr>
                  )}
                  {(visibleGoods as LineRow[]).map((line, i) => {
                    const diff = line.actualQuantity - line.bookQuantity;
                    const xuLy = getXuLy(line);
                    return (
                      <tr key={line._id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff", borderTop: "1px solid #f1f5f9" }}>
                        <td style={s.td}>
                          <input
                            style={{ ...s.cellInp, background: line._locked ? "#f8fafc" : "#fff", color: line._locked ? "#475569" : "#1e293b", cursor: line._locked ? "default" : "text" }}
                            value={line.goodsId}
                            readOnly={!!line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "goodsId", e.target.value)}
                          />
                        </td>
                        <td style={s.td}>
                          <input
                            style={{ ...s.cellInp, background: line._locked ? "#f8fafc" : "#fff", color: line._locked ? "#475569" : "#1e293b", cursor: line._locked ? "default" : "text" }}
                            value={line.goodsName}
                            readOnly={!!line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "goodsName", e.target.value)}
                          />
                        </td>
                        <td style={s.td}>
                          <input
                            style={{ ...s.cellInp, textAlign: "center", background: line._locked ? "#f8fafc" : "#fff", color: line._locked ? "#475569" : "#1e293b", cursor: line._locked ? "default" : "text" }}
                            value={line.unit ?? ""}
                            readOnly={!!line._locked}
                            onChange={(e) => !line._locked && updateField(line._id, "unit", e.target.value)}
                          />
                        </td>
                        <td style={{ ...s.td, textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                          {fmtNum(line.bookQuantity)}
                        </td>
                        <td style={s.td}>
                          <input type="number" min={0} step="1"
                            style={{
                              ...s.cellInp, textAlign: "right",
                              fontWeight: line._touched ? 700 : 400,
                              color: !line._touched ? "#94a3b8" : diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#1e293b",
                              border: !line._touched ? "1px dashed #cbd5e1"
                                : diff !== 0 ? `1.5px solid ${diff > 0 ? "#86efac" : "#fca5a5"}` : "1px solid #e2e8f0",
                              background: !line._touched ? "#f8fafc" : "#fff",
                            }}
                            value={line.actualQuantity}
                            onChange={(e) => updateActual(line._id, e.target.value)}
                          />
                        </td>
                        <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                          color: !line._touched ? "#cbd5e1" : diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#94a3b8" }}>
                          {!line._touched ? "--" : diff === 0 ? "Khớp" : (diff > 0 ? "+" : "") + fmtNum(diff)}
                        </td>
                        <td style={{ ...s.td, textAlign: "center" }}>
                          {xuLy ? (
                            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20,
                              fontSize: 11, fontWeight: 700, color: xuLy.color, background: xuLy.bg,
                              border: `1px solid ${diff > 0 ? "#bbf7d0" : "#fecaca"}` }}>
                              {xuLy.label}
                            </span>
                          ) : <span style={{ color: "#cbd5e1", fontSize: 12 }}>--</span>}
                        </td>
                        <td style={{ ...s.td, textAlign: "center" }}>
                          <button style={s.removeBtn} onClick={() => removeRow(line._id)}>×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {visibleGoods.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #e2e8f0" }}>
                      <td colSpan={3} style={{ ...s.td, textAlign: "right", fontSize: 12, color: "#64748b" }}>
                        Tổng ({visibleGoods.length} dòng):
                      </td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>
                        {fmtNum((visibleGoods as LineRow[]).reduce((a, l) => a + l.bookQuantity, 0))}
                      </td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>
                        {fmtNum((visibleGoods as LineRow[]).reduce((a, l) => a + l.actualQuantity, 0))}
                      </td>
                      <td style={{ ...s.td, textAlign: "right", color: (() => {
                        const d = (visibleGoods as LineRow[]).reduce((a, l) => a + (l.actualQuantity - l.bookQuantity), 0);
                        return d > 0 ? "#16a34a" : d < 0 ? "#dc2626" : "#94a3b8";
                      })() }}>
                        {(() => { const d = (visibleGoods as LineRow[]).reduce((a, l) => a + (l.actualQuantity - l.bookQuantity), 0);
                          return d === 0 ? "--" : (d > 0 ? "+" : "") + fmtNum(d); })()}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* ══ Bảng Tab CHƯA KIỂM ══ */}
          {/* Hiển thị toàn bộ allGoods, tự động bỏ dòng khi goodsId đã có _touched=true bên tab Hàng hóa */}
          {activeTab === "unchecked" && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#fffbeb" }}>
                    <th style={{ ...s.th, textAlign: "left",  width: 130 }}>Mã hàng hóa</th>
                    <th style={{ ...s.th, textAlign: "left"            }}>Tên hàng hóa</th>
                    <th style={{ ...s.th, textAlign: "center", width: 80 }}>ĐVT</th>
                    <th style={{ ...s.th, textAlign: "right",  width: 130 }}>SL tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {(visibleGoods as GoodsDto[]).length === 0 && (
                    <tr><td colSpan={4} style={s.emptyCell}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                      <div style={{ color: "#16a34a", fontWeight: 600 }}>Tất cả hàng hóa đã được kiểm kê</div>
                    </td></tr>
                  )}
                  {(visibleGoods as GoodsDto[]).map((g, i) => (
                    <tr key={g.goodsId} style={{ background: i % 2 === 0 ? "#fff" : "#fffbeb", borderTop: "1px solid #fde68a" }}>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#92400e" }}>
                        {g.goodsId}
                      </td>
                      <td style={{ ...s.td, color: "#475569" }}>{g.goodsName}</td>
                      <td style={{ ...s.td, textAlign: "center", fontSize: 12, color: "#64748b" }}>
                        {g.unit ?? "--"}
                      </td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace", color: "#475569" }}>
                        {fmtNum(g.stockQuantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {(visibleGoods as GoodsDto[]).length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#fffbeb", fontWeight: 700, borderTop: "2px solid #fde68a" }}>
                      <td colSpan={3} style={{ ...s.td, textAlign: "right", fontSize: 12, color: "#92400e" }}>
                        Chưa kiểm ({(visibleGoods as GoodsDto[]).length} mặt hàng):
                      </td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace", color: "#92400e" }}>
                        {fmtNum((visibleGoods as GoodsDto[]).reduce((a, g) => a + g.stockQuantity, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Lỗi validation (ngày trống...) hiện ở đây; lỗi save hiện bên trong modal */}
        {error && !showWarning && (
          <div style={{ padding: "10px 14px", background: "#fff1f2",
            border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Bottom bar */}
        <div style={s.bottomBar}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            💡 Tìm và chọn hàng hóa, nhập <strong>SL thực tế</strong> — chênh lệch &amp; cột xử lý tự tính.
            Dòng chưa nhập sẽ hiện ở tab <strong>Chưa kiểm</strong>.
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.btnSecondary} onClick={() => router.push("/dashboard/stock-take")}>Huỷ</button>
            <button style={s.btnPrimary} onClick={handleSaveClick} disabled={saving}>
              {saving ? "⏳ Đang lưu..." : "💾 Lưu"}
            </button>
          </div>
        </div>

      </div>

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
  page:        { background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif", fontSize: 14, color: "#1e293b" },
  topBar:      { display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky" as const, top: 0, zIndex: 100 },
  backBtn:     { height: 32, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 12, color: "#475569" },
  pageTitle:   { flex: 1, fontSize: 16, fontWeight: 700, margin: 0 },
  body:        { maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "flex", flexDirection: "column" as const, gap: 16 },
  card:        { background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  sectionSub:  { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 10 },
  lbl:         { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 },
  inp:         { width: "100%", height: 34, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" as const, color: "#1e293b", background: "#fff" },
  tabBar:      { display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 4 },
  tabBtn:      { padding: "9px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" as const, marginBottom: -1 },
  th:          { padding: "8px 12px", color: "#475569", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" as const },
  td:          { padding: "5px 10px", verticalAlign: "middle" as const },
  cellInp:     { width: "100%", height: 30, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 13, outline: "none", boxSizing: "border-box" as const, background: "#fff", color: "#1e293b" },
  emptyCell:   { padding: "36px 0", textAlign: "center" as const, color: "#94a3b8", fontSize: 13 },
  addRowBtn:   { height: 30, padding: "0 12px", border: "1.5px solid #3b82f6", borderRadius: 7, background: "#eff6ff", color: "#2563eb", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const },
  removeBtn:   { background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16, padding: 2, lineHeight: 1 },
  dropdown:    { position: "absolute" as const, top: "calc(100% + 4px)", left: 0, minWidth: 480, width: "max-content", maxWidth: 640, zIndex: 9999, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" as const },
  dropdownItem:{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13, whiteSpace: "nowrap" as const },
  spinner:     { width: 24, height: 24, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  bottomBar:   { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  btnPrimary:  { height: 36, padding: "0 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#2563eb,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnSecondary:{ height: 36, padding: "0 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
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