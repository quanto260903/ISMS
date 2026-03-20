// features/stock-take/components/StockTakeDetailPage.tsx
// Route: /dashboard/stock-take/[id]
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStockTakeById, updateStockTake, processStockTake, deleteStockTake } from "../stockTake.api";
import type {
  StockTakeFullDto, StockTakeDetailDto,
  UpdateStockTakeHeaderRequest, CreateStockTakeDetailRequest,
  ProcessStockTakeResultDto,
} from "../types/stockTake.types";
import { MemberPanel } from "./MemberPanel";

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--";
const fmtNum = (n: number) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ── Kết quả xử lý ─────────────────────────────────────────────
function ProcessResultBanner({ result }: { result: ProcessStockTakeResultDto }) {
  return (
    <div style={{ margin: "0 0 16px", borderRadius: 10, border: "1px solid #bbf7d0", background: "#f0fdf4", padding: "14px 20px" }}>
      <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 8, fontSize: 14 }}>✅ Xử lý kiểm kê thành công</div>
      <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.8 }}>
        {result.importVoucherCode && <div>📥 Phiếu nhập kho đã tạo: <strong>{result.importVoucherCode}</strong></div>}
        {result.exportVoucherCode && <div>📤 Phiếu xuất kho đã tạo: <strong>{result.exportVoucherCode}</strong></div>}
        {!result.importVoucherCode && !result.exportVoucherCode && <div>Không có chênh lệch — không cần tạo phiếu điều chỉnh.</div>}
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────
function DeleteConfirmModal({ voucherCode, busy, onConfirm, onClose }: {
  voucherCode: string; busy: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #fecaca", background: "#fff1f2" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#b91c1c" }}>🗑 Xác nhận xóa phiếu</span>
          <button style={{ width: 26, height: 26, border: "none", background: "#fecaca", color: "#b91c1c", borderRadius: 6, cursor: "pointer" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 20, lineHeight: 1.7 }}>
            Bạn có chắc muốn xóa phiếu <strong style={{ color: "#6d28d9", fontFamily: "monospace" }}>{voucherCode}</strong>?
            <br />Hành động này <strong>không thể hoàn tác</strong>.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={m.btnSec} onClick={onClose} disabled={busy}>Hủy</button>
            <button style={{ ...m.btnSec, border: "none", background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", fontWeight: 700 }}
              onClick={onConfirm} disabled={busy}>{busy ? "⏳ Đang xóa..." : "🗑 Xóa"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal xác nhận Xử lý ──────────────────────────────────────
function ProcessModal({ lines, busy, onClose, onConfirm }: {
  lines: StockTakeDetailDto[]; busy: boolean; onClose: () => void; onConfirm: () => void;
}) {
  const surplus  = lines.filter((l) => l.differenceQuantity > 0);
  const shortage = lines.filter((l) => l.differenceQuantity < 0);
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>⚙️ Xác nhận xử lý phiếu kiểm kê</span>
          <button style={m.close} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.7 }}>
            Hệ thống sẽ tự động sinh phiếu nhập/xuất kho tương ứng với hàng hóa chênh lệch.
            <strong> Sau khi xử lý phiếu sẽ không thể chỉnh sửa.</strong>
          </p>
          {surplus.length > 0 && (
            <div style={m.successBox}>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 6 }}>📥 Tạo phiếu NHẬP kho ({surplus.length} mặt hàng thừa)</div>
              {surplus.map((l) => (
                <div key={l.stockTakeDetailId} style={{ fontSize: 12, color: "#166534" }}>
                  • {l.goodsName} ({l.goodsId}) — thừa <strong>+{fmtNum(l.differenceQuantity)}</strong> {l.unit ?? ""}
                </div>
              ))}
            </div>
          )}
          {shortage.length > 0 && (
            <div style={m.dangerBox}>
              <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}>📤 Tạo phiếu XUẤT kho ({shortage.length} mặt hàng thiếu)</div>
              {shortage.map((l) => (
                <div key={l.stockTakeDetailId} style={{ fontSize: 12, color: "#991b1b" }}>
                  • {l.goodsName} ({l.goodsId}) — thiếu <strong>{fmtNum(l.differenceQuantity)}</strong> {l.unit ?? ""}
                </div>
              ))}
            </div>
          )}
          {surplus.length === 0 && shortage.length === 0 && (
            <div style={m.infoBox}>✅ Tất cả mặt hàng đều khớp — không cần tạo phiếu điều chỉnh.</div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button style={m.btnSec} onClick={onClose}>Huỷ</button>
            <button style={m.btnProcess} onClick={onConfirm} disabled={busy}>
              {busy ? "⏳ Đang xử lý..." : "⚙️ Xử lý"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal chỉnh sửa phiếu ─────────────────────────────────────
interface EditLine extends CreateStockTakeDetailRequest { _id: number; }

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
    voucher.lines.map((l, i) => ({ _id: i + 1, goodsId: l.goodsId, goodsName: l.goodsName, unit: l.unit, bookQuantity: l.bookQuantity, actualQuantity: l.actualQuantity }))
  );
  const [ctr, setCtr] = useState(voucher.lines.length + 1);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  const upd = (id: number, f: string, v: string | number) =>
    setLines((p) => p.map((l) => l._id === id ? { ...l, [f]: v } : l));
  const addRow = () => { setLines((p) => [...p, { _id: ctr, goodsId: "", goodsName: "", unit: "", bookQuantity: 0, actualQuantity: 0 }]); setCtr((c) => c + 1); };
  const delRow = (id: number) => setLines((p) => p.filter((l) => l._id !== id));

  const handleSave = async () => {
    setBusy(true); setErr("");
    try {
      await onSave({
        voucherDate, stockTakeDate, purpose: purpose || undefined,
        member1: member1 || undefined, position1: position1 || undefined,
        member2: member2 || undefined, position2: position2 || undefined,
        member3: member3 || undefined, position3: position3 || undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        stockTakeDetails: lines.map(({ _id, ...rest }) => ({
          ...rest, bookQuantity: Number(rest.bookQuantity) || 0, actualQuantity: Number(rest.actualQuantity) || 0,
        })),
      });
      onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi lưu"); }
    finally { setBusy(false); }
  };

  const inp: React.CSSProperties = { width: "100%", height: 34, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" as const, color: "#1e293b", background: "#fff" };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 880, maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>✏️ Chỉnh sửa phiếu kiểm kê — {voucher.voucherCode}</span>
          <button style={m.close} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 22px 20px", overflowY: "auto", maxHeight: "calc(92vh - 56px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 14 }}>
            <div><label style={m.lbl}>Ngày lập</label><input type="date" style={inp} value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} /></div>
            <div><label style={m.lbl}>Ngày kiểm kê</label><input type="date" style={inp} value={stockTakeDate} onChange={(e) => setStockTakeDate(e.target.value)} /></div>
            <div><label style={m.lbl}>Mục đích</label><input style={inp} value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <MemberPanel
              member1={member1} setMember1={setMember1} position1={position1} setPosition1={setPosition1}
              member2={member2} setMember2={setMember2} position2={position2} setPosition2={setPosition2}
              member3={member3} setMember3={setMember3} position3={position3} setPosition3={setPosition3}
              inputStyle={inp}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Danh sách hàng hóa</span>
            <button style={m.addBtn} onClick={addRow}>+ Thêm dòng</button>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)" }}>
                  <th style={m.th}>Mã hàng</th><th style={m.th}>Tên hàng hóa</th>
                  <th style={{ ...m.th, width: 70 }}>ĐVT</th>
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
                      <td style={m.td}><input style={m.ci} value={line.goodsId}    onChange={(e) => upd(line._id, "goodsId", e.target.value)} /></td>
                      <td style={m.td}><input style={m.ci} value={line.goodsName}  onChange={(e) => upd(line._id, "goodsName", e.target.value)} /></td>
                      <td style={m.td}><input style={m.ci} value={line.unit ?? ""} onChange={(e) => upd(line._id, "unit", e.target.value)} /></td>
                      <td style={{ ...m.td, textAlign: "right" }}>
                        <input type="number" style={{ ...m.ci, textAlign: "right" }} value={line.bookQuantity} onChange={(e) => upd(line._id, "bookQuantity", e.target.value)} />
                      </td>
                      <td style={{ ...m.td, textAlign: "right" }}>
                        <input type="number" style={{ ...m.ci, textAlign: "right", fontWeight: 700, color: diff !== 0 ? (diff > 0 ? "#16a34a" : "#dc2626") : "#1e293b" }}
                          value={line.actualQuantity} onChange={(e) => upd(line._id, "actualQuantity", e.target.value)} />
                      </td>
                      <td style={{ ...m.td, textAlign: "right", fontWeight: 700, color: diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#94a3b8" }}>
                        {diff === 0 ? "--" : (diff > 0 ? "+" : "") + fmtNum(diff)}
                      </td>
                      <td style={{ ...m.td, textAlign: "center" }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 16 }} onClick={() => delRow(line._id)}>×</button>
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
// MAIN: Detail Page
// ══════════════════════════════════════════════════════════════
export default function StockTakeDetailPage({ voucherId }: { voucherId: string }) {
  const router = useRouter();

  const [voucher,       setVoucher]       = useState<StockTakeFullDto | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [busy,          setBusy]          = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [showProcess,   setShowProcess]   = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [processResult, setProcessResult] = useState<ProcessStockTakeResultDto | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [keyword,       setKeyword]       = useState("");
  const [filterTab,     setFilterTab]     = useState<"all" | "surplus" | "shortage">("all");

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const fetchVoucher = useCallback(async () => {
    setLoading(true);
    try { setVoucher(await getStockTakeById(voucherId)); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi tải phiếu", false); }
    finally { setLoading(false); }
  }, [voucherId]);

  useEffect(() => { fetchVoucher(); }, [fetchVoucher]);

  const isCompleted = voucher?.isCompleted === true;

  const handleSave = async (req: UpdateStockTakeHeaderRequest) => {
    const updated = await updateStockTake(voucherId, req);
    setVoucher(updated); showToast("Đã lưu phiếu kiểm kê");
  };

  const handleProcess = async () => {
    setBusy(true);
    try {
      const { result, voucher: updated } = await processStockTake(voucherId);
      setVoucher(updated); setProcessResult(result); setShowProcess(false);
      showToast("Xử lý kiểm kê thành công ✅");
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi xử lý", false); }
    finally { setBusy(false); }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try { await deleteStockTake(voucherId); router.push("/dashboard/stock-take"); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi xóa", false); setDeleting(false); setShowDelete(false); }
  };

  const visibleLines = (voucher?.lines ?? []).filter((l) => {
    const matchKw  = !keyword || l.goodsId.toLowerCase().includes(keyword.toLowerCase()) || l.goodsName.toLowerCase().includes(keyword.toLowerCase());
    const matchTab = filterTab === "all" ? true : filterTab === "surplus" ? l.differenceQuantity > 0 : l.differenceQuantity < 0;
    return matchKw && matchTab;
  });

  const surplusCount  = voucher?.lines.filter((l) => l.differenceQuantity > 0).length  ?? 0;
  const shortageCount = voucher?.lines.filter((l) => l.differenceQuantity < 0).length  ?? 0;
  const matchedCount  = voucher?.lines.filter((l) => l.differenceQuantity === 0).length ?? 0;

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#7c3aed", fontFamily: FONT }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #ede9fe", borderTopColor: "#7c3aed", animation: "spin 0.75s linear infinite", margin: "0 auto" }} />
      <div style={{ marginTop: 14, color: "#94a3b8" }}>Đang tải phiếu...</div>
    </div>
  );
  if (!voucher) return (
    <div style={{ padding: 60, textAlign: "center", color: "#b91c1c", fontFamily: FONT }}>Không tìm thấy phiếu kiểm kê</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: FONT, fontSize: 14, color: "#1e293b" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 9999, padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          background: toast.ok ? "#f0fdf4" : "#fff1f2", color: toast.ok ? "#15803d" : "#b91c1c", border: `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}` }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* ── Hero banner ── */}
      <div style={{ ...s.heroBanner, paddingBottom: 18 }}>
        <div style={s.heroOrb} /><div style={s.heroOrb2} />
        <button style={s.backBtn} onClick={() => router.push("/dashboard/stock-take")}>← Quay lại</button>
        <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
          <div style={s.heroEyebrow}>Kiểm kê kho · Chi tiết phiếu</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
            <h1 style={{ ...s.heroTitle, fontSize: 20 }}>{voucher.voucherCode}</h1>
            <span style={{
              padding: "3px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: isCompleted ? "rgba(240,253,244,0.9)" : "rgba(255,251,235,0.9)",
              color:      isCompleted ? "#15803d" : "#d97706",
              border:     `1px solid ${isCompleted ? "#86efac" : "#fde68a"}`,
            }}>
              {isCompleted ? "✓ Hoàn thành" : "◑ Đang kiểm"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
            Ngày lập: <strong style={{ color: "#fff" }}>{fmtDate(voucher.voucherDate)}</strong>
            <span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>
            Ngày kiểm: <strong style={{ color: "#fff" }}>{fmtDate(voucher.stockTakeDate)}</strong>
            {voucher.purpose && <><span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>{voucher.purpose}</>}
            {voucher.createdBy && <><span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>Tạo bởi: {voucher.createdBy}</>}
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 8, alignItems: "center" }}>
          {!isCompleted ? (
            <>
              <button style={s.btnGhost} onClick={() => setShowEdit(true)}>✏️ Sửa</button>
              <button style={{ ...s.btnGhost, borderColor: "rgba(252,165,165,0.6)", color: "#fca5a5" }} onClick={() => setShowDelete(true)}>🗑 Xóa</button>
              <button style={s.btnProcess} onClick={() => setShowProcess(true)} disabled={busy}>⚙️ Xử lý</button>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)" }}>
              Phiếu đã hoàn thành — chỉ đọc
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hội đồng kiểm kê */}
        {(voucher.member1 || voucher.member2 || voucher.member3) && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 18px", fontSize: 13, color: "#475569", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            🧑‍💼 <strong>Thành phần tham gia:</strong>&nbsp;
            {[
              voucher.member1 && `${voucher.member1}${voucher.position1 ? ` (${voucher.position1})` : ""}`,
              voucher.member2 && `${voucher.member2}${voucher.position2 ? ` (${voucher.position2})` : ""}`,
              voucher.member3 && `${voucher.member3}${voucher.position3 ? ` (${voucher.position3})` : ""}`,
            ].filter(Boolean).join(" · ")}
          </div>
        )}

        {processResult && <ProcessResultBanner result={processResult} />}

        {/* Hint banner */}
        {!isCompleted && (surplusCount > 0 || shortageCount > 0) && !processResult && (
          <div style={{ padding: "12px 18px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <span>
              Phiếu có <strong>{surplusCount} mặt hàng thừa</strong> và <strong>{shortageCount} mặt hàng thiếu</strong>.
              Nhấn <strong>&quot;Xử lý&quot;</strong> để tự động sinh phiếu nhập/xuất kho.
            </span>
            <button style={{ ...s.btnProcess, height: 30, fontSize: 12, whiteSpace: "nowrap" as const, padding: "0 14px" }}
              onClick={() => setShowProcess(true)}>⚙️ Xử lý ngay</button>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          {[
            { label: "Tổng mặt hàng", value: voucher.lines.length, color: "#1e293b",  bg: "#f8fafc", border: "#e2e8f0" },
            { label: "Khớp",          value: matchedCount,          color: matchedCount  > 0 ? "#16a34a" : "#94a3b8", bg: matchedCount  > 0 ? "#f0fdf4" : "#f8fafc", border: matchedCount  > 0 ? "#bbf7d0" : "#e2e8f0" },
            { label: "Thừa",          value: surplusCount,          color: surplusCount  > 0 ? "#d97706" : "#94a3b8", bg: surplusCount  > 0 ? "#fffbeb" : "#f8fafc", border: surplusCount  > 0 ? "#fde68a" : "#e2e8f0" },
            { label: "Thiếu",         value: shortageCount,         color: shortageCount > 0 ? "#dc2626" : "#94a3b8", bg: shortageCount > 0 ? "#fff1f2" : "#f8fafc", border: shortageCount > 0 ? "#fca5a5" : "#e2e8f0" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: "12px 20px", minWidth: 120, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          {/* Filter toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #f1f5f9", gap: 10, flexWrap: "wrap" as const }}>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "surplus", "shortage"] as const).map((v) => {
                const labels = { all: `Tất cả (${voucher.lines.length})`, surplus: `Thừa (${surplusCount})`, shortage: `Thiếu (${shortageCount})` };
                return (
                  <button key={v}
                    style={{ height: 30, padding: "0 14px", border: "1.5px solid", borderRadius: 20, cursor: "pointer", fontSize: 12,
                      background:   filterTab === v ? "#ede9fe" : "#fff",
                      borderColor:  filterTab === v ? "#c4b5fd" : "#e2e8f0",
                      color:        filterTab === v ? "#6d28d9" : "#64748b",
                      fontWeight:   filterTab === v ? 700 : 400 }}
                    onClick={() => setFilterTab(v)}>
                    {labels[v]}
                  </button>
                );
              })}
            </div>
            <div style={{ position: "relative", width: 260, height: 34, border: "1.5px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 9, fontSize: 12, color: "#94a3b8" }}>🔍</span>
              <input style={{ border: "none", outline: "none", background: "transparent", paddingLeft: 28, width: "100%", fontSize: 13 }}
                placeholder="Tìm mã hàng, tên hàng..."
                value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)" }}>
                  <th style={{ ...s.th, width: 120 }}>Mã hàng hóa</th>
                  <th style={s.th}>Tên hàng hóa</th>
                  <th style={{ ...s.th, width: 80, textAlign: "center" }}>ĐVT</th>
                  <th style={{ ...s.th, width: 130, textAlign: "right" }}>SL tồn kho</th>
                  <th style={{ ...s.th, width: 140, textAlign: "right" }}>SL tồn thực tế</th>
                  <th style={{ ...s.th, width: 110, textAlign: "right" }}>Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {visibleLines.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>Không có dòng nào</td></tr>
                )}
                {visibleLines.map((line, i) => (
                  <tr key={line.stockTakeDetailId} style={{ background: i % 2 === 0 ? "#fff" : "#fafbff", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#6d28d9", fontWeight: 600 }}>{line.goodsId}</td>
                    <td style={{ ...s.td, fontWeight: 500 }}>{line.goodsName}</td>
                    <td style={{ ...s.td, textAlign: "center", fontSize: 12, color: "#64748b" }}>{line.unit ?? "--"}</td>
                    <td style={{ ...s.td, textAlign: "right", color: "#475569", fontFamily: "monospace" }}>{fmtNum(line.bookQuantity)}</td>
                    <td style={{ ...s.td, textAlign: "right", fontWeight: 700, color: line.differenceQuantity !== 0 ? (line.differenceQuantity > 0 ? "#16a34a" : "#dc2626") : "#1e293b" }}>
                      {fmtNum(line.actualQuantity)}
                    </td>
                    <td style={{ ...s.td, textAlign: "right", fontWeight: 700, color: line.differenceQuantity > 0 ? "#16a34a" : line.differenceQuantity < 0 ? "#dc2626" : "#94a3b8" }}>
                      {line.differenceQuantity === 0 ? "--" : (line.differenceQuantity > 0 ? "+" : "") + fmtNum(line.differenceQuantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {visibleLines.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#f8fafc", fontWeight: 700, borderTop: "2px solid #e2e8f0" }}>
                    <td colSpan={3} style={{ ...s.td, textAlign: "right", color: "#64748b", fontSize: 12 }}>Tổng cộng:</td>
                    <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>{fmtNum(visibleLines.reduce((a, l) => a + l.bookQuantity, 0))}</td>
                    <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>{fmtNum(visibleLines.reduce((a, l) => a + l.actualQuantity, 0))}</td>
                    <td style={{ ...s.td, textAlign: "right",
                      color: (() => { const d = visibleLines.reduce((a, l) => a + l.differenceQuantity, 0); return d > 0 ? "#16a34a" : d < 0 ? "#dc2626" : "#94a3b8"; })() }}>
                      {(() => { const d = visibleLines.reduce((a, l) => a + l.differenceQuantity, 0); return d === 0 ? "--" : (d > 0 ? "+" : "") + fmtNum(d); })()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {!isCompleted && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 16px", fontSize: 12, color: "#64748b" }}>
            Bấm <strong>&quot;Xử lý&quot;</strong> — hệ thống sẽ tự động sinh phiếu nhập kho/xuất kho tương ứng với chênh lệch thừa/thiếu sau kiểm kê.
          </div>
        )}
      </div>

      {/* Modals */}
      {showEdit    && <EditModal voucher={voucher} onClose={() => setShowEdit(false)} onSave={handleSave} />}
      {showProcess && <ProcessModal lines={voucher.lines} busy={busy} onClose={() => setShowProcess(false)} onConfirm={handleProcess} />}
      {showDelete  && <DeleteConfirmModal voucherCode={voucher.voucherCode} busy={deleting} onConfirm={handleDeleteConfirm} onClose={() => setShowDelete(false)} />}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────
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
    height: 34, padding: "0 14px", borderRadius: 8,
    border: "1.5px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.12)",
    color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  btnProcess: {
    height: 34, padding: "0 16px", borderRadius: 8, border: "none",
    background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  th: { padding: "11px 16px", textAlign: "left" as const, fontWeight: 700, color: "#fff", fontSize: 12, whiteSpace: "nowrap" as const, letterSpacing: "0.04em" },
  td: { padding: "10px 16px", verticalAlign: "middle" as const },
};

// ── Modal styles ───────────────────────────────────────────────
const m: Record<string, React.CSSProperties> = {
  overlay:    { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" },
  box:        { background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", overflowY: "auto" as const },
  head:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" },
  title:      { fontSize: 15, fontWeight: 700 },
  close:      { width: 28, height: 28, border: "none", background: "#f1f5f9", color: "#64748b", borderRadius: 6, cursor: "pointer" },
  lbl:        { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 },
  th:         { padding: "9px 12px", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.15)", textAlign: "left" as const, whiteSpace: "nowrap" as const },
  td:         { padding: "5px 8px", verticalAlign: "middle" as const },
  ci:         { width: "100%", height: 28, padding: "0 7px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 13, outline: "none", boxSizing: "border-box" as const, background: "#fff" },
  addBtn:     { height: 30, padding: "0 12px", border: "1.5px solid #7c3aed", borderRadius: 7, background: "#ede9fe", color: "#6d28d9", fontWeight: 600, fontSize: 12, cursor: "pointer" },
  btnPri:     { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#6d28d9,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnSec:     { height: 34, padding: "0 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnProcess: { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  successBox: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 10 },
  dangerBox:  { background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 10 },
  infoBox:    { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginBottom: 10, color: "#0369a1", fontSize: 13 },
};