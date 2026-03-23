// ============================================================
//  features/inward/components/EditInwardForm.tsx
// ============================================================

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/shared/styles/sale.styles";
import {
  INWARD_REASON_LABELS,
  getVoucherCodeByReason,
  DEFAULT_CREDIT_ACCOUNT,
} from "../constants/import.constants";
import { useInwardForm }        from "../hooks/useInwardForm";
import { useInwardDetail }      from "../hooks/useInwardDetail";
import { useGoodsSearch }       from "../hooks/useGoodsSearch";
import { useSaleVoucherLookup } from "../hooks/useSaleVoucherLookup";
import InwardItemTable          from "./InwardItemTable";
import { useAuthStore }         from "@/store/authStore";
import type { InwardReason, InwardItem, GoodsSearchResult } from "../types/import.types";

interface Props { voucherId: string }

function detectReason(code?: string): InwardReason {
  if (code === "NK2") return "SALES_RETURN";
  if (code === "NK3") return "OTHER";
  return "PURCHASE";
}

export default function EditInwardForm({ voucherId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserId   = String(user?.userId ?? "");
  const currentUserName = user?.fullName ?? "";

  const { data: initialData, loading: fetchLoading, error: fetchError } =
    useInwardDetail(voucherId);

  const [reason, setReason] = useState<InwardReason>("PURCHASE");

  useEffect(() => {
    if (initialData) setReason(detectReason(initialData.voucherCode));
  }, [initialData?.voucherId]);

  const {
    voucher, message, loading,
    totalAmount,
    setField, handleReasonChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  } = useInwardForm({
    userId:      currentUserId,
    initialData: initialData ?? undefined,
    onSuccess:   () => setTimeout(() => router.push("/dashboard/import"), 1200),
  });

  const saleVoucherLookup = useSaleVoucherLookup();
  const reasonRef = useRef(reason);
  reasonRef.current = reason;

  const createEmptyItemShim = (): InwardItem => ({
    goodsId: "", goodsName: "", unit: "",
    quantity: 1, unitPrice: 0, amount1: 0, promotion: 0,
    debitAccount1: "156", creditAccount1: DEFAULT_CREDIT_ACCOUNT,
    debitAccount2: "1331", creditAccount2: DEFAULT_CREDIT_ACCOUNT,
    userId: currentUserId, createdDateTime: new Date().toISOString(),
  });

  const onReasonChange = (r: InwardReason) => {
    setReason(r);
    handleReasonChange(r);
    saleVoucherLookup.clearLookup();
    setField("customerId", "");
    setField("customerName", "");
    replaceAllItems([createEmptyItemShim()]);
  };

  useEffect(() => {
    const result = saleVoucherLookup.lookupResult;
    if (!result || reasonRef.current !== "SALES_RETURN") return;
    setField("customerId",         result.customerId   ?? "");
    setField("customerName",       result.customerName ?? "");
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);
    const newItems: InwardItem[] = result.items.map((d) => ({
      goodsId: d.goodsId, goodsName: d.goodsName, unit: d.unit,
      quantity: d.quantity, unitPrice: d.unitPrice, amount1: d.amount1,
      promotion: d.promotion ?? 0,
      debitAccount1: "156", creditAccount1: DEFAULT_CREDIT_ACCOUNT,
      debitAccount2: "1331", creditAccount2: DEFAULT_CREDIT_ACCOUNT,
      offsetVoucher: result.voucherId,
      userId: currentUserId, createdDateTime: new Date().toISOString(),
    }));
    replaceAllItems([...newItems, createEmptyItemShim()]);
  }, [saleVoucherLookup.lookupResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId",   goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit",      goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem, onSelectGoods: handleSelectGoods, onAddItem: addItem,
  });

  const prevLengthRef = useRef(0);
  useEffect(() => {
    const cur = voucher.items.length, prev = prevLengthRef.current;
    if (cur > prev) for (let i = 0; i < cur - prev; i++) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSalesReturn = reason === "SALES_RETURN";

  if (fetchLoading) return <div style={{ padding: 40, textAlign: "center", color: "#555" }}>⏳ Đang tải phiếu nhập kho...</div>;
  if (fetchError)   return (
    <div style={{ padding: 40, textAlign: "center", color: "#cc2222" }}>
      ⚠️ {fetchError}<br />
      <button style={{ marginTop: 12, padding: "8px 20px", cursor: "pointer" }}
        onClick={() => router.push("/dashboard/import")}>← Quay lại danh sách</button>
    </div>
  );

  return (
    <div style={styles.container}>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <button style={{ ...styles.btnSecondary, padding: "6px 16px" }}
          onClick={() => router.push("/dashboard/import")}>← Quay lại</button>
        <h2 style={{ ...styles.title, margin: 0 }}>
          Sửa phiếu nhập kho <span style={s.voucherIdBadge}>{voucherId}</span>
        </h2>
      </div>

      {/* Lý do nhập kho */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Lý do nhập kho</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select value={reason} onChange={(e) => onReasonChange(e.target.value as InwardReason)} style={s.reasonSelect}>
            {(["PURCHASE", "SALES_RETURN"] as InwardReason[]).map((r) => (
              <option key={r} value={r}>
                {r === "PURCHASE" ? "🛒 " : "↩️ "}
                {INWARD_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          <span style={s.voucherCodeBadge}>
            Mã CT: <strong style={{ color: "#2255cc" }}>{getVoucherCodeByReason(reason)}</strong>
          </span>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* Tra cứu phiếu bán */}
      {isSalesReturn && (
        <>
          <section style={{ ...styles.section, maxWidth: 860 }}>
            <h3 style={styles.sectionTitle}>Số hóa đơn bán hàng gốc</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ ...styles.fieldGroup, flex: 1, marginBottom: 0 }}>
                <label style={styles.label}>Số hóa đơn bán hàng *</label>
                <input style={styles.input} placeholder="Nhập số phiếu bán, VD: BH12345678"
                  value={saleVoucherLookup.saleVoucherId}
                  onChange={(e) => saleVoucherLookup.setSaleVoucherId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saleVoucherLookup.handleLookup()} />
              </div>
              <button style={{ ...styles.btnPrimary, padding: "8px 20px", minWidth: 110, opacity: saleVoucherLookup.lookupLoading ? 0.6 : 1 }}
                onClick={saleVoucherLookup.handleLookup} disabled={saleVoucherLookup.lookupLoading}>
                {saleVoucherLookup.lookupLoading ? "⏳ Đang tìm..." : "🔍 Tra cứu"}
              </button>
              {saleVoucherLookup.lookupResult && (
                <button style={{ ...styles.btnDanger, padding: "8px 14px" }} onClick={saleVoucherLookup.clearLookup}>✕ Xóa</button>
              )}
            </div>
            {saleVoucherLookup.lookupError && <p style={{ color: "#cc2222", fontSize: 13, marginTop: 6 }}>⚠️ {saleVoucherLookup.lookupError}</p>}
            {saleVoucherLookup.lookupResult && (
              <div style={s.lookupResult}>
                <span style={s.lookupBadge}>✅ Đã tìm thấy</span>
                <span style={{ color: "#166534", fontSize: 13 }}>
                  Phiếu <strong>{saleVoucherLookup.lookupResult.voucherId}</strong>
                  {" · "}Khách: <strong>{saleVoucherLookup.lookupResult.customerName}</strong>
                  {" → "}đã tự động điền vào bảng bên dưới
                </span>
              </div>
            )}
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* Thông tin phiếu */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Thông tin phiếu nhập</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Số phiếu</label>
            <input style={{ ...styles.input, background: "#f5f5f5", color: "#888" }} value={voucher.voucherId} readOnly />
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Ngày nhập kho *</label>
            <input type="date" style={styles.input} value={voucher.voucherDate} onChange={(e) => setField("voucherDate", e.target.value)} />
          </div>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Người lập phiếu</label>
          <input style={{ ...styles.input, background: "#f5f5f5", color: "#555" }} value={currentUserName} readOnly />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{isSalesReturn ? "Mã khách hàng" : "Mã nhà cung cấp"}</label>
          <input style={{ ...styles.input, background: isSalesReturn ? "#f5f5f5" : "#fff", color: isSalesReturn ? "#555" : undefined }}
            placeholder={isSalesReturn ? "Tự điền từ phiếu bán" : "Nhập mã NCC"}
            value={voucher.customerId ?? ""} readOnly={isSalesReturn}
            onChange={(e) => !isSalesReturn && setField("customerId", e.target.value)} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{isSalesReturn ? "Tên khách hàng *" : "Tên nhà cung cấp *"}</label>
          <input style={{ ...styles.input, background: isSalesReturn ? "#f5f5f5" : "#fff", color: isSalesReturn ? "#555" : undefined }}
            placeholder={isSalesReturn ? "Tự điền từ phiếu bán" : "Nhập tên NCC"}
            value={voucher.customerName ?? ""} readOnly={isSalesReturn}
            onChange={(e) => !isSalesReturn && setField("customerName", e.target.value)} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Mã số thuế</label>
          <input style={styles.input} placeholder="Nhập MST" value={voucher.taxCode ?? ""} onChange={(e) => setField("taxCode", e.target.value)} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Địa chỉ</label>
          <input style={styles.input} placeholder="Nhập địa chỉ" value={voucher.address ?? ""} onChange={(e) => setField("address", e.target.value)} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Diễn giải</label>
          <input style={styles.input} placeholder="Nhập diễn giải" value={voucher.voucherDescription ?? ""} onChange={(e) => setField("voucherDescription", e.target.value)} />
        </div>
      </section>

      <hr style={styles.hr} />

      {/* Chi tiết hàng hóa */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Chi tiết hàng hóa
          {isSalesReturn && saleVoucherLookup.lookupResult && (
            <span style={s.autoFilledBadge}>✨ Tự động điền từ phiếu bán</span>
          )}
        </h3>
        {voucher.items.length > 0 && (
          <InwardItemTable
            items={voucher.items}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) => goodsSearch.handleGoodsIdChange(index, value, voucher.items.length)}
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) => goodsSearch.handleSelectGoods(index, goods, totalItems)}
            onSetDropdownPos={goodsSearch.setDropdownPos}
          />
        )}
        {voucher.items.length > 0 && (
          <div style={styles.summaryBox}>
            <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
              <span>Tổng tiền hàng:</span>
              <strong>{totalAmount.toLocaleString("vi-VN")} ₫</strong>
            </div>
          </div>
        )}
      </section>

      <hr style={styles.hr} />

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
        <button style={styles.btnSecondary} onClick={() => router.push("/dashboard/import")}>Hủy</button>
      </div>

      {message && (
        <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13, color: message.includes("thành công") ? "#16a34a" : "#cc2222" }}>
          {message.includes("thành công") ? "✅" : "⚠️"} {message}
        </p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  voucherIdBadge:   { marginLeft: 10, padding: "2px 10px", background: "#f0f4ff", color: "#2255cc", border: "1px solid #c7d7ff", borderRadius: 6, fontSize: 13, fontWeight: 500 },
  reasonSelect:     { height: 38, padding: "0 36px 0 12px", border: "1.5px solid #c7d7ff", borderRadius: 8, background: "#eff6ff", color: "#2255cc", fontWeight: 600, fontSize: 14, cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", minWidth: 220 },
  voucherCodeBadge: { padding: "4px 12px", background: "#f0f4ff", color: "#555", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 12 },
  lookupResult:     { marginTop: 10, padding: "12px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, fontSize: 13 },
  lookupBadge:      { padding: "3px 12px", background: "#16a34a", color: "#fff", borderRadius: 20, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" as const },
  autoFilledBadge:  { marginLeft: 10, padding: "3px 12px", background: "#eff6ff", color: "#4f46e5", border: "1.5px solid #c7d7ff", borderRadius: 20, fontSize: 11, fontWeight: 700 },
};