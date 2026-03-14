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

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--";
const fmtNum = (n: number) =>
  n.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ── Kết quả xử lý (hiển thị ngay trên trang sau khi Process) ──
function ProcessResultBanner({ result }: { result: ProcessStockTakeResultDto }) {
  return (
    <div style={{ margin: "0 24px 16px", borderRadius: 10, border: "1px solid #bbf7d0",
      background: "#f0fdf4", padding: "14px 18px" }}>
      <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 8, fontSize: 14 }}>
        ✅ Xử lý kiểm kê thành công
      </div>
      <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.8 }}>
        {result.importVoucherId && (
          <div>📥 Phiếu nhập kho đã tạo: <strong>{result.importVoucherId}</strong></div>
        )}
        {result.exportVoucherId && (
          <div>📤 Phiếu xuất kho đã tạo: <strong>{result.exportVoucherId}</strong></div>
        )}
        {!result.importVoucherId && !result.exportVoucherId && (
          <div>Không có chênh lệch — không cần tạo phiếu điều chỉnh.</div>
        )}
      </div>
    </div>
  );
}

// ── Modal xác nhận Xử lý ──────────────────────────────────────
function ProcessModal({
  lines, busy, onClose, onConfirm,
}: {
  lines: StockTakeDetailDto[];
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const surplus  = lines.filter((l) => l.differenceQuantity > 0);
  const shortage = lines.filter((l) => l.differenceQuantity < 0);

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 500 }} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>⚙️ Xác nhận xử lý phiếu kiểm kê</span>
          <button style={m.close} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.7 }}>
            Hệ thống sẽ tự động sinh phiếu nhập kho / xuất kho tương ứng với
            số lượng và giá trị hàng hóa chênh lệch thừa / thiếu sau kiểm kê.
            <strong> Sau khi xử lý phiếu sẽ không thể chỉnh sửa.</strong>
          </p>

          {surplus.length > 0 && (
            <div style={m.successBox}>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 6 }}>
                📥 Tạo phiếu NHẬP kho ({surplus.length} mặt hàng thừa)
              </div>
              {surplus.map((l) => (
                <div key={l.stockTakeDetailId} style={{ fontSize: 12, color: "#166534" }}>
                  • {l.goodsName} ({l.goodsId}) — thừa <strong>+{fmtNum(l.differenceQuantity)}</strong> {l.unit ?? ""}
                </div>
              ))}
            </div>
          )}

          {shortage.length > 0 && (
            <div style={m.dangerBox}>
              <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}>
                📤 Tạo phiếu XUẤT kho ({shortage.length} mặt hàng thiếu)
              </div>
              {shortage.map((l) => (
                <div key={l.stockTakeDetailId} style={{ fontSize: 12, color: "#991b1b" }}>
                  • {l.goodsName} ({l.goodsId}) — thiếu <strong>{fmtNum(l.differenceQuantity)}</strong> {l.unit ?? ""}
                </div>
              ))}
            </div>
          )}

          {surplus.length === 0 && shortage.length === 0 && (
            <div style={m.infoBox}>
              ✅ Tất cả mặt hàng đều khớp — không cần tạo phiếu điều chỉnh.
            </div>
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

// ── Modal chỉnh sửa phiếu (header + toàn bộ lines) ───────────
interface EditLine extends CreateStockTakeDetailRequest { _id: number; }

function EditModal({
  voucher, onClose, onSave,
}: {
  voucher: StockTakeFullDto;
  onClose: () => void;
  onSave: (req: UpdateStockTakeHeaderRequest) => Promise<void>;
}) {
  const [voucherDate,   setVoucherDate]   = useState(voucher.voucherDate.slice(0, 10));
  const [stockTakeDate, setStockTakeDate] = useState(voucher.stockTakeDate.slice(0, 10));
  const [purpose,       setPurpose]       = useState(voucher.purpose   ?? "");
  const [member1, setMember1] = useState(voucher.member1   ?? ""); const [position1, setPosition1] = useState(voucher.position1 ?? "");
  const [member2, setMember2] = useState(voucher.member2   ?? ""); const [position2, setPosition2] = useState(voucher.position2 ?? "");
  const [member3, setMember3] = useState(voucher.member3   ?? ""); const [position3, setPosition3] = useState(voucher.position3 ?? "");
  const [lines, setLines] = useState<EditLine[]>(() =>
    voucher.lines.map((l, i) => ({ _id: i + 1, goodsId: l.goodsId, goodsName: l.goodsName, unit: l.unit, bookQuantity: l.bookQuantity, actualQuantity: l.actualQuantity }))
  );
  const [ctr, setCtr] = useState(voucher.lines.length + 1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const upd = (id: number, f: string, v: string | number) =>
    setLines((p) => p.map((l) => l._id === id ? { ...l, [f]: v } : l));

  const addRow = () => { setLines((p) => [...p, { _id: ctr, goodsId: "", goodsName: "", unit: "", bookQuantity: 0, actualQuantity: 0 }]); setCtr(c => c + 1); };
  const delRow = (id: number) => setLines((p) => p.filter((l) => l._id !== id));

  const handleSave = async () => {
    setBusy(true); setErr("");
    try {
      await onSave({
        voucherDate, stockTakeDate,
        purpose: purpose || undefined,
        member1: member1 || undefined, position1: position1 || undefined,
        member2: member2 || undefined, position2: position2 || undefined,
        member3: member3 || undefined, position3: position3 || undefined,
        stockTakeDetails: lines.map(({ _id, ...rest }) => ({
          ...rest, bookQuantity: Number(rest.bookQuantity) || 0, actualQuantity: Number(rest.actualQuantity) || 0,
        })),
      });
      onClose();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Lỗi lưu"); }
    finally { setBusy(false); }
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={{ ...m.box, width: 860, maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <span style={m.title}>✏️ Chỉnh sửa phiếu kiểm kê</span>
          <button style={m.close} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 22px 20px", overflowY: "auto", maxHeight: "calc(92vh - 56px)" }}>
          {/* Header */}
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

          {/* Lines */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Danh sách hàng hóa</span>
            <button style={m.addBtn} onClick={addRow}>+ Thêm dòng</button>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
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
                      <td style={m.td}><input style={m.ci} value={line.goodsId} onChange={(e) => upd(line._id, "goodsId", e.target.value)} /></td>
                      <td style={m.td}><input style={m.ci} value={line.goodsName} onChange={(e) => upd(line._id, "goodsName", e.target.value)} /></td>
                      <td style={m.td}><input style={m.ci} value={line.unit ?? ""} onChange={(e) => upd(line._id, "unit", e.target.value)} /></td>
                      <td style={{ ...m.td, textAlign: "right" }}>
                        <input type="number" style={{ ...m.ci, textAlign: "right" }} value={line.bookQuantity} onChange={(e) => upd(line._id, "bookQuantity", e.target.value)} />
                      </td>
                      <td style={{ ...m.td, textAlign: "right" }}>
                        <input type="number" style={{ ...m.ci, textAlign: "right", fontWeight: 700,
                          color: diff !== 0 ? (diff > 0 ? "#16a34a" : "#dc2626") : "#1e293b" }}
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
  const [processResult, setProcessResult] = useState<ProcessStockTakeResultDto | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [keyword,       setKeyword]       = useState("");
  const [filterTab,     setFilterTab]     = useState<"all" | "surplus" | "shortage">("all");

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

  const isCompleted = voucher?.isCompleted === true;

  // ── Lưu chỉnh sửa ─────────────────────────────────────────
  const handleSave = async (req: UpdateStockTakeHeaderRequest) => {
    const updated = await updateStockTake(voucherId, req);
    setVoucher(updated);
    showToast("Đã lưu phiếu kiểm kê");
  };

  // ── Xử lý phiếu — vẫn ở lại trang ────────────────────────
  const handleProcess = async () => {
    setBusy(true);
    try {
      const { result, voucher: updated } = await processStockTake(voucherId);
      setVoucher(updated);
      setProcessResult(result);
      setShowProcess(false);
      showToast("Xử lý kiểm kê thành công ✅");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi xử lý", false);
    } finally { setBusy(false); }
  };

  // ── Xóa phiếu ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm("Xóa phiếu kiểm kê này?")) return;
    try { await deleteStockTake(voucherId); router.push("/dashboard/stock-take"); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : "Lỗi xóa", false); }
  };

  // ── Filter ─────────────────────────────────────────────────
  const visibleLines = (voucher?.lines ?? []).filter((l) => {
    const matchKw = !keyword || l.goodsId.toLowerCase().includes(keyword.toLowerCase()) || l.goodsName.toLowerCase().includes(keyword.toLowerCase());
    const matchTab = filterTab === "all" ? true : filterTab === "surplus" ? l.differenceQuantity > 0 : l.differenceQuantity < 0;
    return matchKw && matchTab;
  });

  const surplusCount  = voucher?.lines.filter((l) => l.differenceQuantity > 0).length ?? 0;
  const shortageCount = voucher?.lines.filter((l) => l.differenceQuantity < 0).length ?? 0;
  const matchedCount  = voucher?.lines.filter((l) => l.differenceQuantity === 0).length ?? 0;

  // ── Loading / not found ────────────────────────────────────
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
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.ok ? "#f0fdf4" : "#fff1f2",
          color: toast.ok ? "#15803d" : "#b91c1c", border: `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}` }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => router.push("/dashboard/stock-take")}>← Quay lại</button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={s.pageTitle}>{voucher.voucherCode}</h1>
            <span style={{
              display: "inline-block", padding: "2px 12px", borderRadius: 20,
              fontSize: 12, fontWeight: 700,
              background: isCompleted ? "#f0fdf4" : "#fffbeb",
              color:      isCompleted ? "#15803d" : "#d97706",
              border:     `1px solid ${isCompleted ? "#bbf7d0" : "#fde68a"}`,
            }}>
              {isCompleted ? "✓ Hoàn thành" : "◑ Đang kiểm"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            Ngày lập: <strong>{fmtDate(voucher.voucherDate)}</strong>
            <span style={{ margin: "0 8px" }}>·</span>
            Ngày kiểm: <strong>{fmtDate(voucher.stockTakeDate)}</strong>
            {voucher.purpose && <><span style={{ margin: "0 8px" }}>·</span>{voucher.purpose}</>}
            {voucher.createdBy && <><span style={{ margin: "0 8px" }}>·</span>Tạo bởi: {voucher.createdBy}</>}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isCompleted && (
            <>
              <button style={s.btnEdit} onClick={() => setShowEdit(true)}>✏️ Sửa</button>
              <button style={s.btnDel}  onClick={handleDelete}>🗑 Xóa</button>
              {/* NÚT XỬ LÝ — xuất hiện sau khi lưu, trước khi hoàn thành */}
              <button style={s.btnProcess} onClick={() => setShowProcess(true)} disabled={busy}>
                ⚙️ Xử lý
              </button>
            </>
          )}
          {isCompleted && (
            <span style={{ fontSize: 12, color: "#64748b" }}>Phiếu đã hoàn thành — chỉ đọc</span>
          )}
        </div>
      </div>

      {/* Hội đồng kiểm kê */}
      {(voucher.member1 || voucher.member2 || voucher.member3) && (
        <div style={{ padding: "8px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#475569" }}>
          🧑‍💼 Thành phần tham gia:&nbsp;
          {[
            voucher.member1 && `${voucher.member1}${voucher.position1 ? ` (${voucher.position1})` : ""}`,
            voucher.member2 && `${voucher.member2}${voucher.position2 ? ` (${voucher.position2})` : ""}`,
            voucher.member3 && `${voucher.member3}${voucher.position3 ? ` (${voucher.position3})` : ""}`,
          ].filter(Boolean).join(" · ")}
        </div>
      )}

      {/* Kết quả xử lý — hiện ngay trên trang sau process */}
      {processResult && <ProcessResultBanner result={processResult} />}

      {/* ── Hint banner ── */}
      {!isCompleted && (surplusCount > 0 || shortageCount > 0) && !processResult && (
        <div style={{ margin: "12px 24px 0", padding: "10px 16px", background: "#fffbeb",
          border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>
            Phiếu có <strong>{surplusCount} mặt hàng thừa</strong>{" "}
            và <strong>{shortageCount} mặt hàng thiếu</strong>.
            Nhấn <strong>"Xử lý"</strong> để tự động sinh phiếu nhập/xuất kho.
          </span>
          <button style={{ ...s.btnProcess, height: 30, fontSize: 12, whiteSpace: "nowrap" }}
            onClick={() => setShowProcess(true)}>⚙️ Xử lý ngay</button>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Tổng mặt hàng", value: voucher.lines.length, color: "#1e293b"  },
          { label: "Khớp",          value: matchedCount,          color: matchedCount  > 0 ? "#16a34a" : "#94a3b8" },
          { label: "Thừa",          value: surplusCount,          color: surplusCount  > 0 ? "#d97706" : "#94a3b8" },
          { label: "Thiếu",         value: shortageCount,         color: shortageCount > 0 ? "#dc2626" : "#94a3b8" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", minWidth: 110 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs + search toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px", borderBottom: "1px solid #f1f5f9", gap: 10, flexWrap: "wrap" }}>
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

      {/* ── Bảng hàng hóa (chỉ đọc) ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, textAlign: "left",   width: 120 }}>Mã hàng hóa</th>
              <th style={{ ...s.th, textAlign: "left"             }}>Tên hàng hóa</th>
              <th style={{ ...s.th, textAlign: "center", width: 80 }}>ĐVT</th>
              <th style={{ ...s.th, textAlign: "right",  width: 130 }}>SL tồn kho</th>
              <th style={{ ...s.th, textAlign: "right",  width: 140 }}>SL tồn thực tế</th>
              <th style={{ ...s.th, textAlign: "right",  width: 110 }}>Chênh lệch</th>
            </tr>
          </thead>
          <tbody>
            {visibleLines.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                Không có dòng nào
              </td></tr>
            )}
            {visibleLines.map((line, i) => (
              <tr key={line.stockTakeDetailId} style={{
                background: i % 2 === 0 ? "#fff" : "#fafbff", borderBottom: "1px solid #f1f5f9",
              }}>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#334155" }}>{line.goodsId}</td>
                <td style={{ ...s.td, fontWeight: 500 }}>{line.goodsName}</td>
                <td style={{ ...s.td, textAlign: "center", fontSize: 12, color: "#64748b" }}>{line.unit ?? "--"}</td>
                <td style={{ ...s.td, textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                  {fmtNum(line.bookQuantity)}
                </td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                  color: line.differenceQuantity !== 0 ? (line.differenceQuantity > 0 ? "#16a34a" : "#dc2626") : "#1e293b" }}>
                  {fmtNum(line.actualQuantity)}
                </td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                  color: line.differenceQuantity > 0 ? "#16a34a" : line.differenceQuantity < 0 ? "#dc2626" : "#94a3b8" }}>
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

      {/* Bottom hint */}
      {!isCompleted && (
        <div style={{ margin: "12px 24px", padding: "10px 14px", background: "#f8fafc",
          border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
          Bấm <strong>"Xử lý"</strong> phần mềm sẽ tự động sinh phiếu nhập kho/xuất kho tương ứng
          với số lượng và giá trị hàng hóa chênh lệch thừa/thiếu sau kiểm kê.
        </div>
      )}

      {/* Modals */}
      {showEdit && <EditModal voucher={voucher} onClose={() => setShowEdit(false)} onSave={handleSave} />}
      {showProcess && (
        <ProcessModal
          lines={voucher.lines}
          busy={busy}
          onClose={() => setShowProcess(false)}
          onConfirm={handleProcess}
        />
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:       { background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif", fontSize: 14, color: "#1e293b" },
  toast:      { position: "fixed", top: 20, right: 24, zIndex: 9999, padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
  topBar:     { display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky" as const, top: 0, zIndex: 100, flexWrap: "wrap" as const },
  backBtn:    { height: 32, padding: "0 12px", border: "1.5px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 12, color: "#475569", whiteSpace: "nowrap" as const },
  pageTitle:  { fontSize: 17, fontWeight: 700, margin: 0 },
  btnEdit:    { height: 34, padding: "0 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnDel:     { height: 34, padding: "0 12px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff1f2", color: "#b91c1c", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnProcess: { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  table:      { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th:         { padding: "9px 14px", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 12, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" as const },
  td:         { padding: "8px 14px", verticalAlign: "middle" as const },
  spinner:    { width: 26, height: 26, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

// ── Modal styles ───────────────────────────────────────────────
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
  btnProcess: { height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  successBox: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 10 },
  dangerBox:  { background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 10 },
  infoBox:    { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginBottom: 10, color: "#0369a1", fontSize: 13 },
};