// features/stock-take/components/StockTakeDetailPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getStockTakeById, updateStockTake, deleteStockTake,
} from "../stockTake.api";
import type {
  StockTakeFullDto,
  UpdateStockTakeHeaderRequest, CreateStockTakeDetailRequest,
} from "../types/stockTake.types";

// Lỗi 5: thêm T00:00:00 tránh lệch timezone với DateOnly từ C#
const fmtDate = (s: string | null) =>
  s ? new Date(s + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--";

const fmtNum = (n: number) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Lỗi 7: thêm hàm tính nhãn xử lý cho trang detail
function getXuLyLabel(diff: number): { label: string; color: string; bg: string; border: string } | null {
  if (diff > 0) return { label: "Nhập kho", color: "#15803d", bg: "#f0fdf4", border: "#86efac" };
  if (diff < 0) return { label: "Xuất kho", color: "#b91c1c", bg: "#fff1f2", border: "#fca5a5" };
  return         { label: "Khớp ✓",   color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" };
}


// ── Modal chỉnh sửa phiếu ─────────────────────────────────────
interface EditLine extends CreateStockTakeDetailRequest { _id: number; bookQuantity: number; }

function EditModal({ voucher, onClose, onSave }: {
  voucher: StockTakeFullDto;
  onClose: () => void;
  onSave: (req: UpdateStockTakeHeaderRequest) => Promise<void>;
}) {
  const [voucherDate,   setVoucherDate]   = useState(voucher.voucherDate.slice(0, 10));
  const [stockTakeDate, setStockTakeDate] = useState(voucher.stockTakeDate.slice(0, 10));
  const [purpose,       setPurpose]       = useState(voucher.purpose ?? "");
  const [member1, setMember1] = useState(voucher.member1 ?? ""); const [position1, setPosition1] = useState(voucher.position1 ?? "");
  const [member2, setMember2] = useState(voucher.member2 ?? ""); const [position2, setPosition2] = useState(voucher.position2 ?? "");
  const [member3, setMember3] = useState(voucher.member3 ?? ""); const [position3, setPosition3] = useState(voucher.position3 ?? "");

  const [lines, setLines] = useState<EditLine[]>(() =>
    voucher.lines.map((l, i) => ({
      _id:           i + 1,
      goodsId:       l.goodsId,
      goodsName:     l.goodsName,
      unit:          l.unit,
      bookQuantity:  l.bookQuantity,   // chỉ để hiển thị, không gửi backend
      actualQuantity: l.actualQuantity,
    }))
  );
  const [ctr, setCtr] = useState(voucher.lines.length + 1);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  // Lỗi 4: chỉ cho phép sửa actualQuantity, bookQuantity là readonly
  const updActual = (id: number, v: string) =>
    setLines((p) => p.map((l) => l._id === id ? { ...l, actualQuantity: Math.max(0, Number(v) || 0) } : l));

  const updField = (id: number, f: keyof Omit<EditLine, "_id" | "bookQuantity" | "actualQuantity">, v: string) =>
    setLines((p) => p.map((l) => l._id === id ? { ...l, [f]: v } : l));

  const addRow = () => {
    setLines((p) => [...p, { _id: ctr, goodsId: "", goodsName: "", unit: "", bookQuantity: 0, actualQuantity: 0 }]);
    setCtr((c) => c + 1);
  };
  const delRow = (id: number) => setLines((p) => p.filter((l) => l._id !== id));

  const handleSave = async () => {
    setBusy(true); setErr("");
    try {
      await onSave({
        voucherDate, stockTakeDate,
        purpose:   purpose   || undefined,
        member1:   member1   || undefined, position1: position1 || undefined,
        member2:   member2   || undefined, position2: position2 || undefined,
        member3:   member3   || undefined, position3: position3 || undefined,
        // Lỗi 2: chỉ gửi actualQuantity, KHÔNG gửi bookQuantity
        stockTakeDetails: lines.map(({ _id, bookQuantity, ...rest }) => ({
          ...rest,
          actualQuantity: Number(rest.actualQuantity) || 0,
        })),
      });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi lưu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 860, maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>✏️ Chỉnh sửa phiếu kiểm kê</span>
          <button style={m.close} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 22px 20px", overflowY: "auto", maxHeight: "calc(92vh - 56px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 14 }}>
            <div><label style={m.lbl}>Ngày lập</label>
              <input type="date" style={m.inp} value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} /></div>
            <div><label style={m.lbl}>Ngày kiểm kê</label>
              <input type="date" style={m.inp} value={stockTakeDate} onChange={(e) => setStockTakeDate(e.target.value)} /></div>
            <div><label style={m.lbl}>Mục đích</label>
              <input style={m.inp} value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px 12px", marginBottom: 16 }}>
            {([
              { mv: member1, pv: position1, sm: setMember1, sp: setPosition1, i: 1 },
              { mv: member2, pv: position2, sm: setMember2, sp: setPosition2, i: 2 },
              { mv: member3, pv: position3, sm: setMember3, sp: setPosition3, i: 3 },
            ] as const).map(({ mv, pv, sm, sp, i }) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <input style={m.inp} placeholder={`Thành viên ${i}`} value={mv} onChange={(e) => sm(e.target.value)} />
                <input style={{ ...m.inp, height: 28, fontSize: 12 }} placeholder={`Chức vụ ${i}`} value={pv} onChange={(e) => sp(e.target.value)} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Danh sách hàng hóa</span>
            <button style={m.addBtn} onClick={addRow}>+ Thêm dòng</button>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={m.th}>Mã hàng</th>
                  <th style={m.th}>Tên hàng hóa</th>
                  <th style={{ ...m.th, width: 70 }}>ĐVT</th>
                  {/* Lỗi 4: đổi tên cột thành "Tồn sách" và hiển thị readonly */}
                  <th style={{ ...m.th, width: 105, textAlign: "right" }}>Tồn sách</th>
                  <th style={{ ...m.th, width: 115, textAlign: "right" }}>Thực tế</th>
                  <th style={{ ...m.th, width: 100, textAlign: "right" }}>Chênh lệch</th>
                  <th style={{ ...m.th, width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "24px 0", textAlign: "center", color: "#94a3b8" }}>Chưa có hàng hóa</td></tr>
                )}
                {lines.map((line, i) => {
                  const diff = (Number(line.actualQuantity) || 0) - (Number(line.bookQuantity) || 0);
                  return (
                    <tr key={line._id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff", borderTop: "1px solid #f1f5f9" }}>
                      <td style={m.td}><input style={m.ci} value={line.goodsId} onChange={(e) => updField(line._id, "goodsId", e.target.value)} /></td>
                      <td style={m.td}><input style={m.ci} value={line.goodsName} onChange={(e) => updField(line._id, "goodsName", e.target.value)} /></td>
                      <td style={m.td}><input style={m.ci} value={line.unit ?? ""} onChange={(e) => updField(line._id, "unit", e.target.value)} /></td>
                      {/* Lỗi 4: BookQuantity readonly — không cho user sửa tay */}
                      <td style={{ ...m.td, textAlign: "right" }}>
                        <input
                          style={{ ...m.ci, textAlign: "right", background: "#f8fafc", color: "#475569", cursor: "not-allowed" }}
                          value={fmtNum(Number(line.bookQuantity) || 0)}
                          readOnly
                          title="Tồn kho hệ thống — không thể sửa trực tiếp"
                        />
                      </td>
                      <td style={{ ...m.td, textAlign: "right" }}>
                        <input type="number" min={0}
                          style={{
                            ...m.ci, textAlign: "right", fontWeight: 700,
                            color: diff !== 0 ? (diff > 0 ? "#16a34a" : "#dc2626") : "#1e293b",
                          }}
                          value={line.actualQuantity}
                          onChange={(e) => updActual(line._id, e.target.value)}
                        />
                      </td>
                      <td style={{ ...m.td, textAlign: "right", fontWeight: 700, color: diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#1d4ed8" }}>
                        {diff === 0 ? "Khớp" : (diff > 0 ? "+" : "") + fmtNum(diff)}
                      </td>
                      <td style={{ ...m.td, textAlign: "center" }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16 }}
                          onClick={() => delRow(line._id)}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {err && <div style={{ color: "#b91c1c", fontSize: 12, marginBottom: 10, padding: "8px 12px", background: "#fff1f2", borderRadius: 6 }}>⚠️ {err}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={m.btnSec} onClick={onClose}>Huỷ</button>
            <button style={m.btnPri} onClick={handleSave} disabled={busy}>{busy ? "⏳" : "💾"} Lưu</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function StockTakeDetailPage({ voucherId }: { voucherId: string }) {
  const router = useRouter();

  const [voucher,       setVoucher]       = useState<StockTakeFullDto | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [showEdit,      setShowEdit]      = useState(false);
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [keyword,       setKeyword]       = useState("");
  const [filterTab,     setFilterTab]     = useState<"all" | "surplus" | "shortage">("all");
  const [nk3Done,       setNk3Done]       = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(`nk3_done_${voucherId}`) === "true"
  );
  const [xk3Done,       setXk3Done]       = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(`xk3_done_${voucherId}`) === "true"
  );

  // Khi tab được focus lại (người dùng quay về từ trang tạo phiếu), cập nhật trạng thái
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setNk3Done(localStorage.getItem(`nk3_done_${voucherId}`) === "true");
        setXk3Done(localStorage.getItem(`xk3_done_${voucherId}`) === "true");
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [voucherId]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const fetchVoucher = useCallback(async () => {
    setLoading(true);
    try { setVoucher(await getStockTakeById(voucherId)); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi tải phiếu", false); }
    finally { setLoading(false); }
  }, [voucherId]);

  useEffect(() => { fetchVoucher(); }, [fetchVoucher]);

  const handleSave = async (req: UpdateStockTakeHeaderRequest) => {
    const updated = await updateStockTake(voucherId, req);
    setVoucher(updated);
    showToast("Đã lưu phiếu kiểm kê");
  };

  const handleDelete = async () => {
    if (!confirm("Xóa phiếu kiểm kê này?")) return;
    try { await deleteStockTake(voucherId); router.push("/dashboard/stock-take"); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi xóa", false); }
  };

  const visibleLines = (voucher?.lines ?? []).filter((l) => {
    const matchKw  = !keyword || l.goodsId.toLowerCase().includes(keyword.toLowerCase()) || l.goodsName.toLowerCase().includes(keyword.toLowerCase());
    const matchTab = filterTab === "all" ? true : filterTab === "surplus" ? l.differenceQuantity > 0 : l.differenceQuantity < 0;
    return matchKw && matchTab;
  });

  const surplusCount  = voucher?.lines.filter((l) => l.differenceQuantity > 0).length ?? 0;
  const shortageCount = voucher?.lines.filter((l) => l.differenceQuantity < 0).length ?? 0;
  const matchedCount  = voucher?.lines.filter((l) => l.differenceQuantity === 0).length ?? 0;

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
      <div style={s.spinner} /><div style={{ marginTop: 12 }}>Đang tải phiếu...</div>
    </div>
  );
  if (!voucher) return (
    <div style={{ padding: 60, textAlign: "center", color: "#b91c1c" }}>Không tìm thấy phiếu kiểm kê</div>
  );

  return (
    <div style={s.page}>
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#f0fdf4" : "#fff1f2", color: toast.ok ? "#15803d" : "#b91c1c", border: `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}` }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => router.push("/dashboard/stock-take")}>← Quay lại</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={s.pageTitle}>{voucher.stockTakeVoucherId}</h1>
            <span style={{
              display: "inline-block", padding: "2px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: (nk3Done || xk3Done) ? "#f0fdf4" : "#eff6ff",
              color:      (nk3Done || xk3Done) ? "#15803d" : "#1d4ed8",
              border:     `1px solid ${(nk3Done || xk3Done) ? "#bbf7d0" : "#bfdbfe"}`,
            }}>
              {(nk3Done || xk3Done) ? "✓ Đã xử lý" : "◑ Chưa xử lý"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            Ngày lập: <strong>{fmtDate(voucher.voucherDate)}</strong>
            <span style={{ margin: "0 8px" }}>·</span>
            Ngày kiểm: <strong>{fmtDate(voucher.stockTakeDate)}</strong>
            {voucher.purpose   && <><span style={{ margin: "0 8px" }}>·</span>{voucher.purpose}</>}
            {voucher.createdBy && <><span style={{ margin: "0 8px" }}>·</span>Tạo bởi: {voucher.createdBy}</>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={s.btnEdit} onClick={() => setShowEdit(true)}>✏️ Sửa</button>
          <button style={s.btnDel}  onClick={handleDelete}>🗑 Xóa</button>
        </div>
      </div>

      {/* Thành phần chứng kiến kiểm kê */}
      {(voucher.member1 || voucher.member2 || voucher.member3) && (
        <div style={{ padding: "12px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🧑‍💼 Thành phần chứng kiến kiểm kê
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px 16px" }}>
            {([
              { name: voucher.member1, pos: voucher.position1, idx: 1 },
              { name: voucher.member2, pos: voucher.position2, idx: 2 },
              { name: voucher.member3, pos: voucher.position3, idx: 3 },
            ] as const).filter((m) => m.name).map(({ name, pos, idx }) => (
              <div key={idx} style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#6d28d9,#4f46e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                }}>
                  {idx}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{name}</div>
                  {pos && <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{pos}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


     {/* Hiển thị khi phiếu có chênh lệch */}
{(surplusCount > 0 || shortageCount > 0) && (
  <div style={{
    margin: "12px 24px 0", padding: "16px 20px",
    background: "#f8faff", border: "1px solid #ddd6fe",
    borderRadius: 10
  }}>
    <div style={{ fontWeight: 700, color: "#6d28d9", marginBottom: 12, fontSize: 14 }}>
      📋 Điều chỉnh tồn kho theo kết quả kiểm kê
    </div>
    <div style={{ fontSize: 13, color: "#475569", marginBottom: 14, lineHeight: 1.7 }}>
      Phiếu có chênh lệch — vui lòng lập phiếu nhập/xuất kho tương ứng.
      Phiếu xuất kho yêu cầu chọn phiếu nhập nguồn (xuất kho đích danh).
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {surplusCount > 0 && (
        nk3Done ? (
          <div style={{
            height: 36, padding: "0 18px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6,
            border: "1.5px solid #bbf7d0", background: "#f0fdf4",
            color: "#15803d", fontWeight: 700, fontSize: 13,
          }}>
            ✅ Đã lập phiếu nhập NK3
          </div>
        ) : (
          <button
            style={{
              height: 36, padding: "0 18px", borderRadius: 8,
              border: "none", background: "linear-gradient(135deg,#15803d,#16a34a)",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
            onClick={() => router.push(`/dashboard/import/new?fromStockTake=${voucherId}&reason=NK3`)}
          >
            📥 Lập phiếu nhập NK3 ({surplusCount} mặt hàng thừa)
          </button>
        )
      )}
      {shortageCount > 0 && (
        xk3Done ? (
          <div style={{
            height: 36, padding: "0 18px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6,
            border: "1.5px solid #fca5a5", background: "#fff1f2",
            color: "#b91c1c", fontWeight: 700, fontSize: 13,
          }}>
            ✅ Đã lập phiếu xuất XK3
          </div>
        ) : (
          <button
            style={{
              height: 36, padding: "0 18px", borderRadius: 8,
              border: "none", background: "linear-gradient(135deg,#b91c1c,#dc2626)",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
            onClick={() => router.push(`/dashboard/export/new?fromStockTake=${voucherId}&reason=XK3`)}
          >
            📤 Lập phiếu xuất XK3 ({shortageCount} mặt hàng thiếu)
          </button>
        )
      )}
    </div>
    <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
      💡 Phiếu xuất sẽ mở form xuất kho — bạn cần chọn phiếu nhập nguồn cho từng mặt hàng.
    </div>
  </div>
)}


      {/* Summary cards */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Tổng mặt hàng", value: voucher.lines.length, color: "#1e293b" },
          { label: "Khớp",          value: matchedCount,          color: matchedCount  > 0 ? "#1d4ed8" : "#94a3b8" },
          { label: "Thừa",          value: surplusCount,          color: surplusCount  > 0 ? "#d97706" : "#94a3b8" },
          { label: "Thiếu",         value: shortageCount,         color: shortageCount > 0 ? "#dc2626" : "#94a3b8" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", minWidth: 110 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: "1px solid #f1f5f9", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "surplus", "shortage"] as const).map((v) => {
            const labels = { all: `Tất cả (${voucher.lines.length})`, surplus: `Thừa (${surplusCount})`, shortage: `Thiếu (${shortageCount})` };
            return (
              <button key={v}
                style={{ height: 30, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 20,
                  background: filterTab === v ? "#eff6ff" : "#fff",
                  borderColor: filterTab === v ? "#bfdbfe" : "#e2e8f0",
                  color: filterTab === v ? "#2563eb" : "#64748b",
                  fontWeight: filterTab === v ? 700 : 400,
                  cursor: "pointer", fontSize: 12 }}
                onClick={() => setFilterTab(v)}>
                {labels[v]}
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative", width: 260, height: 32, border: "1.5px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 9, fontSize: 12, color: "#94a3b8" }}>🔍</span>
          <input style={{ border: "none", outline: "none", background: "transparent", paddingLeft: 28, width: "100%", fontSize: 13 }}
            placeholder="Tìm mã hàng, tên hàng..."
            value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      {/* Bảng hàng hóa — Lỗi 7: thêm cột Xử lý */}
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, textAlign: "left",   width: 120 }}>Mã hàng hóa</th>
              <th style={{ ...s.th, textAlign: "left"             }}>Tên hàng hóa</th>
              <th style={{ ...s.th, textAlign: "center", width: 80 }}>ĐVT</th>
              <th style={{ ...s.th, textAlign: "right",  width: 130 }}>SL tồn kho</th>
              <th style={{ ...s.th, textAlign: "right",  width: 140 }}>SL thực tế</th>
              <th style={{ ...s.th, textAlign: "right",  width: 110 }}>Chênh lệch</th>
              {/* Lỗi 7: thêm cột Xử lý */}
              <th style={{ ...s.th, textAlign: "center", width: 110 }}>Xử lý</th>
            </tr>
          </thead>
          <tbody>
            {visibleLines.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                Không có dòng nào
              </td></tr>
            )}
            {visibleLines.map((line, i) => {
              const xuLy = getXuLyLabel(line.differenceQuantity);
              return (
                <tr key={line.stockTakeDetailId} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff", borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#334155" }}>{line.goodsId}</td>
                  <td style={{ ...s.td, fontWeight: 500 }}>{line.goodsName}</td>
                  <td style={{ ...s.td, textAlign: "center", fontSize: 12, color: "#64748b" }}>{line.unit ?? "--"}</td>
                  <td style={{ ...s.td, textAlign: "right", color: "#475569", fontFamily: "monospace" }}>{fmtNum(line.bookQuantity)}</td>
                  <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                    color: line.differenceQuantity !== 0 ? (line.differenceQuantity > 0 ? "#16a34a" : "#dc2626") : "#1e293b" }}>
                    {fmtNum(line.actualQuantity)}
                  </td>
                  <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                    color: line.differenceQuantity > 0 ? "#16a34a" : line.differenceQuantity < 0 ? "#dc2626" : "#1d4ed8" }}>
                    {line.differenceQuantity === 0 ? "Khớp" : (line.differenceQuantity > 0 ? "+" : "") + fmtNum(line.differenceQuantity)}
                  </td>
                  {/* Lỗi 7: hiển thị badge Xử lý */}
                  <td style={{ ...s.td, textAlign: "center" }}>
                    {xuLy && (
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                        color: xuLy.color, background: xuLy.bg, border: `1px solid ${xuLy.border}`,
                      }}>
                        {xuLy.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {visibleLines.length > 0 && (
            <tfoot>
              <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #e2e8f0" }}>
                <td colSpan={3} style={{ ...s.td, textAlign: "right", color: "#64748b", fontSize: 12 }}>Tổng cộng:</td>
                <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>{fmtNum(visibleLines.reduce((a, l) => a + l.bookQuantity, 0))}</td>
                <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>{fmtNum(visibleLines.reduce((a, l) => a + l.actualQuantity, 0))}</td>
                <td style={{ ...s.td, textAlign: "right",
                  color: (() => { const d = visibleLines.reduce((a, l) => a + l.differenceQuantity, 0); return d > 0 ? "#16a34a" : d < 0 ? "#dc2626" : "#1d4ed8"; })() }}>
                  {(() => { const d = visibleLines.reduce((a, l) => a + l.differenceQuantity, 0); return d === 0 ? "Khớp" : (d > 0 ? "+" : "") + fmtNum(d); })()}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showEdit && <EditModal voucher={voucher} onClose={() => setShowEdit(false)} onSave={handleSave} />}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif", fontSize: 14, color: "#1e293b" },
  toast:      { position: "fixed", top: 20, right: 24, zIndex: 9999, padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
  topBar:     { display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky" as const, top: 0, zIndex: 100, flexWrap: "wrap" as const },
  backBtn:    { height: 32, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 12, color: "#475569", whiteSpace: "nowrap" as const },
  pageTitle:  { fontSize: 17, fontWeight: 700, margin: 0 },
  btnEdit:    { height: 34, padding: "0 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnDel:     { height: 34, padding: "0 12px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff1f2", color: "#b91c1c", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  table:      { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th:         { padding: "9px 14px", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" as const },
  td:         { padding: "8px 14px", verticalAlign: "middle" as const },
  spinner:    { width: 26, height: 26, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

const m: Record<string, React.CSSProperties> = {
  overlay:    { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" },
  box:        { background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", overflowY: "auto" as const },
  head:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" },
  title:      { fontSize: 15, fontWeight: 700 },
  close:      { width: 28, height: 28, border: "none", background: "#f1f5f9", color: "#64748b", borderRadius: 6, cursor: "pointer" },
  lbl:        { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 },
  inp:        { width: "100%", height: 34, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" as const, color: "#1e293b", background: "#fff" },
  th:         { padding: "8px 10px", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #e2e8f0", textAlign: "left" as const, whiteSpace: "nowrap" as const },
  td:         { padding: "5px 8px", verticalAlign: "middle" as const },
  ci:         { width: "100%", height: 28, padding: "0 7px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 13, outline: "none", boxSizing: "border-box" as const, background: "#fff" },
  addBtn:     { height: 28, padding: "0 10px", border: "1.5px solid #3b82f6", borderRadius: 6, background: "#eff6ff", color: "#2563eb", fontWeight: 600, fontSize: 12, cursor: "pointer" },
  btnPri:     { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#2563eb,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnSec:     { height: 34, padding: "0 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  successBox: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 10 },
  dangerBox:  { background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 10 },
  infoBox:    { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginBottom: 10, color: "#0369a1", fontSize: 13 },
};