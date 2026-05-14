// ============================================================
//  features/sale/components/SaleDetailPage.tsx
//  Xem chi tiết phiếu bán hàng (view-only)
// ============================================================

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSaleDetail } from "../hooks/useSaleDetail";
import type { SaleVoucherDetailItem } from "../types/sale.types";

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

const fmtDate = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("vi-VN") : "--";

const fmtMoney = (n: number | null) =>
  n != null ? n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) : "--";

const VOUCHER_CODE_LABELS: Record<string, string> = {
  BH1: "Tiền mặt",
  BH2: "Ngân hàng",
  BH3: "Chưa thanh toán",
};

interface Props { voucherId: string }

export default function SaleDetailPage({ voucherId }: Props) {
  const router = useRouter();
  const { data, loading, error } = useSaleDetail(voucherId);

  if (loading) {
    return (
      <div style={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
        <div style={s.spinnerWrap}>
          <div style={s.spinner} />
          <p style={{ color: "#7c3aed", fontWeight: 600, fontFamily: FONT }}>Đang tải phiếu bán...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
        <div style={s.errorBox}>⚠️ {error || "Không tìm thấy phiếu bán"}</div>
      </div>
    );
  }

  const items = data.items.filter((i) => (i.quantity ?? 0) > 0);
  const totalAmount = items.reduce((sum, i) => sum + (i.amount1 ?? 0), 0);
  const paymentLabel = data.voucherCode ? (VOUCHER_CODE_LABELS[data.voucherCode] ?? data.voucherCode) : "--";

  return (
    <div style={s.page}>

      {/* ── Hero header ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb1} />
        <div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>WMS Pro · Bán hàng</div>
          <h1 style={s.heroTitle}>Chi tiết phiếu bán hàng</h1>
          <p style={s.heroSub}>Mã phiếu: <strong style={{ color: "#fff" }}>{data.voucherId}</strong></p>
        </div>
        <button style={s.btnBack} onClick={() => router.push("/dashboard/sale")}>
          ← Quay lại danh sách
        </button>
      </div>

      {/* ── Thông tin phiếu ── */}
      <div style={s.infoCard}>
        <div style={s.sectionTitle}>Thông tin phiếu bán</div>
        <div style={s.infoGrid}>
          <InfoRow label="Số phiếu"       value={data.voucherId} />
          <InfoRow label="Hình thức TT"   value={paymentLabel} />
          <InfoRow label="Ngày chứng từ"  value={fmtDate(data.voucherDate)} />
          <InfoRow label="Mã khách hàng"  value={data.customerId ?? "--"} />
          <InfoRow label="Tên khách hàng" value={data.customerName ?? "--"} />
          <InfoRow label="Mã số thuế"     value={data.taxCode ?? "--"} />
          <InfoRow label="Địa chỉ"        value={data.address ?? "--"} />
          <InfoRow label="Diễn giải"      value={data.voucherDescription ?? "--"} />
          {data.bankName && (
            <InfoRow label="Ngân hàng" value={`${data.bankName} — ${data.bankAccountNumber ?? ""}`} />
          )}
        </div>
      </div>

      {/* ── Bảng hàng hóa ── */}
      <div style={s.tableCard}>
        <div style={s.sectionTitle} >Danh sách hàng hóa</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>#</th>
                <th style={s.th}>Mã hàng</th>
                <th style={s.th}>Tên hàng hóa</th>
                <th style={s.th}>ĐVT</th>
                <th style={{ ...s.th, textAlign: "right" }}>SL</th>
                <th style={{ ...s.th, textAlign: "right" }}>Đơn giá</th>
                <th style={{ ...s.th, textAlign: "right" }}>KM</th>
                <th style={{ ...s.th, textAlign: "right" }}>Thành tiền</th>
                <th style={{ ...s.th, textAlign: "right" }}>Giá vốn</th>
                <th style={s.th}>TK Nợ</th>
                <th style={s.th}>TK Có</th>
                <th style={s.th}>CT đối trừ (NK)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                    Không có hàng hóa
                  </td>
                </tr>
              )}
              {items.map((item, i) => (
                <SaleDetailRow key={i} item={item} index={i} />
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8faff" }}>
                <td colSpan={7} style={{ ...s.td, fontWeight: 700, textAlign: "right", color: "#64748b" }}>
                  Tổng cộng:
                </td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 800, color: "#7c3aed", fontSize: 14 }}>
                  {fmtMoney(totalAmount)} ₫
                </td>
                <td colSpan={4} style={s.td} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}

// ── Row ──────────────────────────────────────────────────────
function SaleDetailRow({ item, index }: { item: SaleVoucherDetailItem; index: number }) {
  return (
    <tr style={{ background: index % 2 === 0 ? "#fff" : "#fafafa" }}>
      <td style={{ ...s.td, color: "#94a3b8", width: 32 }}>{index + 1}</td>
      <td style={{ ...s.td, color: "#7c3aed", fontWeight: 700 }}>{item.goodsId ?? "--"}</td>
      <td style={{ ...s.td, fontWeight: 500 }}>{item.goodsName ?? "--"}</td>
      <td style={{ ...s.td, color: "#64748b" }}>{item.unit ?? "--"}</td>
      <td style={{ ...s.td, textAlign: "right" }}>{item.quantity ?? "--"}</td>
      <td style={{ ...s.td, textAlign: "right" }}>{fmtMoney(item.unitPrice)}</td>
      <td style={{ ...s.td, textAlign: "right", color: "#64748b" }}>{fmtMoney(item.promotion)}</td>
      <td style={{ ...s.td, textAlign: "right", fontWeight: 700, color: "#7c3aed" }}>
        {fmtMoney(item.amount1)} ₫
      </td>
      <td style={{ ...s.td, textAlign: "right", color: "#64748b" }}>{fmtMoney(item.amount2)}</td>
      <td style={{ ...s.td, color: "#64748b", fontSize: 12 }}>{item.debitAccount1 ?? "--"}</td>
      <td style={{ ...s.td, color: "#64748b", fontSize: 12 }}>{item.creditAccount1 ?? "--"}</td>
      <td style={{ ...s.td }}>
        {item.offsetVoucher ? (
          <span style={s.nkBadge}>{item.offsetVoucher}</span>
        ) : (
          <span style={{ color: "#94a3b8" }}>--</span>
        )}
      </td>
    </tr>
  );
}

// ── InfoRow helper ────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:       { padding: 0, minHeight: "100vh", background: "#f8faff", fontFamily: FONT, display: "flex", flexDirection: "column", gap: 0 },
  heroBanner: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #ec4899 100%)", borderRadius: 14, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 8px 24px rgba(124,58,237,0.3)" },
  heroOrb1:   { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)" },
  heroOrb2:   { position: "absolute", bottom: -30, left: 100, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow:{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle:  { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.3px" },
  heroSub:    { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4, marginBottom: 0 },
  btnBack:    { display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 },
  infoCard:   { background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  sectionTitle:{ fontSize: 13, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 },
  infoGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px 24px" },
  infoRow:    { display: "flex", gap: 8, alignItems: "baseline" },
  infoLabel:  { fontSize: 12, color: "#94a3b8", fontWeight: 700, minWidth: 120, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 },
  infoValue:  { fontSize: 13, color: "#1e293b", fontWeight: 500, wordBreak: "break-word" },
  tableCard:  { background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 16 },
  table:      { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  theadRow:   { background: "linear-gradient(135deg, #7c3aed, #a855f7)" },
  th:         { padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", fontSize: 12, letterSpacing: "0.04em" },
  td:         { padding: "10px 14px", borderBottom: "1px solid #f1f5f9", color: "#334155", whiteSpace: "nowrap" },
  nkBadge:    { display: "inline-block", padding: "2px 10px", borderRadius: 20, background: "#f0fdf4", color: "#15803d", border: "1.5px solid #86efac", fontSize: 11, fontWeight: 700 },
  spinnerWrap:{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 60 },
  spinner:    { width: 40, height: 40, borderRadius: "50%", border: "3px solid #f3e8ff", borderTopColor: "#7c3aed" },
  errorBox:   { display: "inline-flex", alignItems: "center", gap: 8, background: "#fff1f2", color: "#b91c1c", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "12px 20px", fontWeight: 600, fontSize: 13, fontFamily: FONT },
};
