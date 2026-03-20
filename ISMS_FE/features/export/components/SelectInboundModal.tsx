// ============================================================
//  features/export/components/SelectInboundModal.tsx
//  Modal BẮT BUỘC chọn chứng từ nhập khi thêm hàng vào phiếu xuất.
//  User có thể chọn NHIỀU phiếu nhập, mỗi phiếu nhập 1 số lượng.
//  Chỉ đóng được khi tổng số lượng đã chọn > 0.
// ============================================================

"use client";

import React, { useEffect, useState } from "react";
import type { FifoPreviewItem } from "../types/export.types";

export interface InboundSelection {
  inboundVoucherCode: string;
  allocatedQty:       number;
  warehouseId:        string | null;
  remainingQty:       number;   // tồn còn lại = warehouseIn - warehouseOut
  warehouseIn:        number;   // tổng đã nhập
  warehouseOut:       number;   // tổng đã xuất
  unitPrice:          number;   // đơn giá nhập tại thời điểm nhập kho
  costPerUnit:        number;   // cost / warehouseIn — dùng tính Amount1 khi xuất
}

interface Props {
  goodsId:   string;
  goodsName: string;
  // Danh sách phiếu nhập có hàng — lấy từ API FIFO preview
  inbounds:  InboundSelection[];
  loading:   boolean;
  // Xác nhận: trả về danh sách phiếu đã chọn + số lượng
  onConfirm: (selections: InboundSelection[]) => void;
  // Không cho phép đóng mà không chọn
  onCancel:  () => void;
  canCancel: boolean; // false = không hiện nút Hủy (bắt buộc chọn)
}

const fmtQty = (n: number) => n.toLocaleString("vi-VN");

export default function SelectInboundModal({
  goodsId, goodsName, inbounds, loading,
  onConfirm, onCancel, canCancel,
}: Props) {
  // State: số lượng user nhập cho từng phiếu nhập
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Reset khi inbounds thay đổi (hàng khác)
  useEffect(() => {
    setQuantities({});
  }, [goodsId]);

  const totalSelected = Object.values(quantities).reduce((a, b) => a + (b || 0), 0);

  const setQty = (code: string, val: number, max: number) => {
    const clamped = Math.max(0, Math.min(val, max));
    setQuantities((prev) => ({ ...prev, [code]: clamped }));
  };

  const handleConfirm = () => {
    if (totalSelected <= 0) return;
    const selections = inbounds
      .filter((ib) => (quantities[ib.inboundVoucherCode] ?? 0) > 0)
      .map((ib) => ({
        ...ib,
        allocatedQty: quantities[ib.inboundVoucherCode] ?? 0,
      }));
    onConfirm(selections);
  };

  return (
    <div style={s.overlay} onClick={canCancel ? onCancel : undefined}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.title}>📦 Chọn chứng từ nhập kho</div>
            <div style={s.subtitle}>
              <span style={s.codeTag}>{goodsId}</span>
              {goodsName}
            </div>
          </div>
          {canCancel && (
            <button style={s.closeBtn} onClick={onCancel} title="Hủy">✕</button>
          )}
        </div>

        {/* Hướng dẫn */}
        <div style={s.guide}>
          Nhập số lượng xuất từ mỗi phiếu nhập. Có thể chọn nhiều phiếu.
          <strong> Bắt buộc nhập ít nhất 1 phiếu</strong> trước khi xác nhận.
        </div>

        {/* Body */}
        <div style={s.body}>
          {loading ? (
            <div style={s.loadingBox}>
              <div style={s.spinner} />
              <div style={{ marginTop: 10, color: "#64748b", fontSize: 13 }}>
                Đang tải danh sách phiếu nhập...
              </div>
            </div>
          ) : inbounds.length === 0 ? (
            <div style={s.emptyBox}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontWeight: 600, color: "#92400e", marginBottom: 4 }}>
                Không tìm thấy phiếu nhập nào có hàng này
              </div>
              <div style={{ fontSize: 12, color: "#b45309" }}>
                Hàng hóa chưa được nhập kho hoặc đã xuất hết.
              </div>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Phiếu nhập</th>
                  <th style={{ ...s.th, textAlign: "right", color: "#15803d" }}>Đã nhập</th>
                  <th style={{ ...s.th, textAlign: "right", color: "#dc2626" }}>Đã xuất</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Còn tồn</th>
                  <th style={{ ...s.th, textAlign: "right", color: "#1d4ed8" }}>
                    Số lượng xuất
                  </th>
                </tr>
              </thead>
              <tbody>
                {inbounds.map((ib, i) => {
                  const qty     = quantities[ib.inboundVoucherCode] ?? 0;
                  const hasQty  = qty > 0;
                  return (
                    <tr key={ib.inboundVoucherCode}
                      style={{
                        background: hasQty
                          ? "#f0fdf4"
                          : i % 2 === 0 ? "#fff" : "#f8fafc",
                        transition: "background 0.15s",
                      }}>
                      <td style={s.td}>
                        <span style={s.voucherCode}>{ib.inboundVoucherCode}</span>
                      </td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace", color: "#15803d", fontWeight: 600 }}>
                        {fmtQty(ib.warehouseIn)}
                      </td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace", color: "#dc2626", fontWeight: 600 }}>
                        {fmtQty(ib.warehouseOut)}
                      </td>
                      <td style={{ ...s.td, textAlign: "right", fontFamily: "monospace" }}>
                        <span style={{
                          color: ib.remainingQty <= 5 ? "#dc2626" : "#15803d",
                          fontWeight: 700,
                        }}>
                          {fmtQty(ib.remainingQty)}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: "right" }}>
                        <input
                          type="number"
                          min={0}
                          max={ib.remainingQty}
                          value={qty === 0 ? "" : qty}
                          placeholder="0"
                          style={{
                            ...s.qtyInput,
                            borderColor: hasQty ? "#86efac" : "#e2e8f0",
                            background:  hasQty ? "#f0fdf4" : "#fff",
                            color:       hasQty ? "#15803d" : "#1e293b",
                            fontWeight:  hasQty ? 700 : 400,
                          }}
                          onChange={(e) =>
                            setQty(
                              ib.inboundVoucherCode,
                              Number(e.target.value),
                              ib.remainingQty
                            )
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Tổng cộng */}
              <tfoot>
                <tr style={{ background: "#f0f4ff", borderTop: "2px solid #e2e8f0" }}>
                  <td colSpan={3} style={{ ...s.td, fontWeight: 700, color: "#475569", fontSize: 12 }}>
                    Tổng số lượng xuất:
                  </td>
                  <td style={{ ...s.td, textAlign: "right", fontWeight: 700,
                    color: totalSelected > 0 ? "#1d4ed8" : "#94a3b8",
                    fontFamily: "monospace", fontSize: 14 }}>
                    {fmtQty(totalSelected)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {canCancel && (
            <button style={s.btnSecondary} onClick={onCancel}>Hủy</button>
          )}
          <div style={{ flex: 1 }} />
          {totalSelected === 0 && inbounds.length > 0 && (
            <span style={{ fontSize: 12, color: "#dc2626", marginRight: 10 }}>
              ⚠️ Chưa nhập số lượng
            </span>
          )}
          <button
            style={{
              ...s.btnPrimary,
              opacity: totalSelected > 0 ? 1 : 0.4,
              cursor:  totalSelected > 0 ? "pointer" : "not-allowed",
            }}
            onClick={handleConfirm}
            disabled={totalSelected <= 0 || inbounds.length === 0}
          >
            ✅ Xác nhận ({fmtQty(totalSelected)})
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay:    { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal:      { background: "#fff", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", width: "100%", maxWidth: 580, maxHeight: "85vh", display: "flex", flexDirection: "column" as const },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 22px 12px", borderBottom: "1px solid #e2e8f0" },
  title:      { fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 },
  subtitle:   { fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 8 },
  codeTag:    { fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", padding: "1px 7px", borderRadius: 4, fontSize: 12 },
  closeBtn:   { width: 28, height: 28, border: "none", background: "#f1f5f9", color: "#64748b", borderRadius: 6, cursor: "pointer", flexShrink: 0 },
  guide:      { padding: "10px 22px", background: "#fffbeb", borderBottom: "1px solid #fde68a", fontSize: 12, color: "#92400e", lineHeight: 1.6 },
  body:       { flex: 1, overflowY: "auto" as const },
  loadingBox: { padding: "40px 0", textAlign: "center" as const },
  spinner:    { width: 28, height: 28, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  emptyBox:   { padding: "40px 22px", textAlign: "center" as const, background: "#fffbeb" },
  table:      { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th:         { padding: "8px 16px", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #e2e8f0", textAlign: "left" as const, position: "sticky" as const, top: 0 },
  td:         { padding: "8px 16px", verticalAlign: "middle" as const, borderBottom: "1px solid #f1f5f9" },
  voucherCode:{ fontFamily: "monospace", fontWeight: 700, color: "#16a34a", fontSize: 13 },
  qtyInput:   { width: 80, height: 30, textAlign: "right" as const, padding: "0 8px", border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  footer:     { display: "flex", alignItems: "center", padding: "14px 22px", borderTop: "1px solid #e2e8f0", gap: 8 },
  btnPrimary: { height: 36, padding: "0 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0f766e,#0891b2)", color: "#fff", fontWeight: 700, fontSize: 13 },
  btnSecondary:{ height: 36, padding: "0 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },
};