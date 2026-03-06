// ============================================================
//  features/inward/components/EditInwardForm.tsx
//  Tái sử dụng logic AddInwardForm — chỉ thêm initialData + edit mode
// ============================================================

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/shared/styles/sale.styles";
import {
  PAYMENT_LABELS,
  INWARD_REASON_LABELS,
  getVoucherCodeByReason,
  getCreditAccountByPayment,
} from "../constants/import.constants";
import { useInwardForm }        from "../hooks/useInwardForm";
import { useInwardDetail }      from "../hooks/useInwardDetail";
import { useGoodsSearch }       from "../hooks/useGoodsSearch";
import { useWarehouseList }     from "../hooks/useWarehouseList";
import { useSaleVoucherLookup } from "../hooks/useSaleVoucherLookup";
import InwardItemTable          from "./InwardItemTable";
import { useAuthStore }         from "@/store/authStore";
import type {
  PaymentOption,
  InwardReason,
  GoodsSearchResult,
} from "../types/import.types";

interface Props {
  voucherId: string;
}

// Detect lý do nhập từ voucherCode
function detectReason(code?: string): InwardReason {
  if (!code) return "PURCHASE";
  if (code === "NK4") return "SALES_RETURN";
  if (code === "NK5") return "OTHER";
  return "PURCHASE";
}

export default function EditInwardForm({ voucherId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserId   = String(user?.userId   ?? "");
  const currentUserName = user?.fullName ?? "";

  // Fetch dữ liệu phiếu gốc
  const { data: initialData, loading: fetchLoading, error: fetchError } =
    useInwardDetail(voucherId);

  const [reason, setReason] = useState<InwardReason>("PURCHASE");

  // Sync reason khi dữ liệu load xong
  useEffect(() => {
    if (initialData) setReason(detectReason(initialData.voucherCode));
  }, [initialData?.voucherId]);

  const {
    voucher, paymentOption, message, loading, isEditMode,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  } = useInwardForm({
    userId:       currentUserId,
    userFullName: currentUserName,
    initialData:  initialData ?? undefined,
    onSuccess:    () => setTimeout(() => router.push("/dashboard/import"), 1200),
  });

  const { warehouses }    = useWarehouseList();
  const saleVoucherLookup = useSaleVoucherLookup();

  const handleReasonChange = (r: InwardReason) => {
    setReason(r);
    const payment = r === "OTHER" ? "CASH" : paymentOption;
    if (r === "OTHER") handlePaymentChange("CASH");
    setField("voucherCode", getVoucherCodeByReason(r, payment));
    saleVoucherLookup.clearLookup();
  };

  useEffect(() => {
    const result = saleVoucherLookup.lookupResult;
    if (!result || reason !== "SALES_RETURN") return;
    setField("customerName",       result.customerName);
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);
    const creditAcc = getCreditAccountByPayment(paymentOption);
    const newItems = result.items.map((d) => ({
      goodsId: d.goodsId, goodsName: d.goodsName, unit: d.unit,
      quantity: d.quantity, unitPrice: d.unitPrice, amount1: d.amount1,
      vat: d.vat, promotion: d.promotion,
      debitAccount1: "156", creditAccount1: creditAcc,
      debitWarehouseId: d.creditWarehouseId,
      debitAccount2: "1331", creditAccount2: creditAcc,
      userId: currentUserId, createdDateTime: new Date().toISOString(),
    }));
    replaceAllItems([...newItems, {
      goodsId: "", goodsName: "", unit: "",
      quantity: 1, unitPrice: 0, amount1: 0, vat: 10, promotion: 0,
      debitAccount1: "156", creditAccount1: creditAcc,
      debitWarehouseId: "", debitAccount2: "1331", creditAccount2: creditAcc,
      userId: currentUserId, createdDateTime: new Date().toISOString(),
    }]);
  }, [saleVoucherLookup.lookupResult]); // eslint-disable-line

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId",   goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit",      goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem: addItem,
  });

  // Sync dropdown count khi items thay đổi
  const prevLengthRef = React.useRef(0);
  useEffect(() => {
    const cur = voucher.items.length, prev = prevLengthRef.current;
    if (cur > prev) for (let i = 0; i < cur - prev; i++) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line

  const isSalesReturn = reason === "SALES_RETURN";

  // ── Loading / Error states ─────────────────────────────
  if (fetchLoading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#555" }}>
      ⏳ Đang tải phiếu nhập kho...
    </div>
  );

  if (fetchError) return (
    <div style={{ padding: 40, textAlign: "center", color: "#cc2222" }}>
      ⚠️ {fetchError}
      <br />
      <button
        style={{ marginTop: 12, padding: "8px 20px", cursor: "pointer" }}
        onClick={() => router.push("/dashboard/import")}
      >
        ← Quay lại danh sách
      </button>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* Header với nút quay lại */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <button
          style={{ ...styles.btnSecondary, padding: "6px 16px" }}
          onClick={() => router.push("/dashboard/import")}
        >
          ← Quay lại
        </button>
        <h2 style={{ ...styles.title, margin: 0 }}>
          Sửa phiếu nhập kho
          <span style={s.voucherIdBadge}>{voucherId}</span>
        </h2>
      </div>

      {/* ── Lý do nhập kho ── */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Lý do nhập kho</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value as InwardReason)}
            style={s.reasonSelect}
          >
            {(["PURCHASE", "SALES_RETURN", "OTHER"] as InwardReason[]).map((r) => (
              <option key={r} value={r}>
                {r === "PURCHASE" ? "🛒 " : r === "SALES_RETURN" ? "↩️ " : "📝 "}
                {INWARD_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          <span style={s.voucherCodeBadge}>
            Mã CT: <strong style={{ color: "#2255cc" }}>
              {getVoucherCodeByReason(reason, paymentOption)}
            </strong>
          </span>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* ── Tra cứu phiếu bán (chỉ khi SALES_RETURN) ── */}
      {isSalesReturn && (
        <>
          <section style={{ ...styles.section, maxWidth: 860 }}>
            <h3 style={styles.sectionTitle}>Số hóa đơn bán hàng gốc</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ ...styles.fieldGroup, flex: 1, marginBottom: 0 }}>
                <label style={styles.label}>Số hóa đơn bán hàng *</label>
                <input
                  style={styles.input}
                  placeholder="Nhập số phiếu bán, VD: BH12345678"
                  value={saleVoucherLookup.saleVoucherId}
                  onChange={(e) => saleVoucherLookup.setSaleVoucherId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saleVoucherLookup.handleLookup()}
                />
              </div>
              <button
                style={{ ...styles.btnPrimary, padding: "8px 20px", minWidth: 110,
                  opacity: saleVoucherLookup.lookupLoading ? 0.6 : 1 }}
                onClick={saleVoucherLookup.handleLookup}
                disabled={saleVoucherLookup.lookupLoading}
              >
                {saleVoucherLookup.lookupLoading ? "⏳ Đang tìm..." : "🔍 Tra cứu"}
              </button>
              {saleVoucherLookup.lookupResult && (
                <button style={{ ...styles.btnDanger, padding: "8px 14px" }}
                  onClick={saleVoucherLookup.clearLookup}>✕ Xóa</button>
              )}
            </div>
            {saleVoucherLookup.lookupError && (
              <p style={{ color: "#cc2222", fontSize: 13, marginTop: 6 }}>
                ⚠️ {saleVoucherLookup.lookupError}
              </p>
            )}
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* ── Hình thức thanh toán (chỉ khi PURCHASE) ── */}
      {reason === "PURCHASE" && (
        <>
          <section style={{ ...styles.section, maxWidth: 860 }}>
            <h3 style={styles.sectionTitle}>Hình thức thanh toán</h3>
            <div style={{ display: "flex", gap: 24 }}>
              {(["UNPAID", "CASH", "BANK"] as PaymentOption[]).map((opt) => (
                <label key={opt} style={styles.radioLabel}>
                  <input type="radio" value={opt}
                    checked={paymentOption === opt}
                    onChange={() => handlePaymentChange(opt)}
                    style={{ marginRight: 6 }}
                  />
                  {PAYMENT_LABELS[opt]}
                </label>
              ))}
            </div>
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* ── Thông tin phiếu ── */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Thông tin phiếu nhập</h3>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Số phiếu *</label>
            <input style={{ ...styles.input, background: "#f5f5f5", color: "#888" }}
              value={voucher.voucherId} readOnly />
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Ngày nhập kho *</label>
            <input type="date" style={styles.input}
              value={voucher.voucherDate}
              onChange={(e) => setField("voucherDate", e.target.value)} />
          </div>
        </div>

        {/* Người lập phiếu — readonly */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Người lập phiếu</label>
          <input style={{ ...styles.input, background: "#f5f5f5", color: "#555" }}
            value={currentUserName} readOnly />
        </div>

        {[
          { label: isSalesReturn ? "Mã khách hàng" : "Mã nhà cung cấp",
            field: "customerId" as const, placeholder: "Nhập mã" },
          { label: isSalesReturn ? "Tên khách hàng *" : "Tên nhà cung cấp *",
            field: "customerName" as const, placeholder: "Nhập tên" },
          { label: "Mã số thuế",  field: "taxCode"           as const, placeholder: "Nhập MST"       },
          { label: "Địa chỉ",    field: "address"            as const, placeholder: "Nhập địa chỉ"   },
          { label: "Diễn giải",  field: "voucherDescription" as const, placeholder: "Nhập diễn giải" },
        ].map(({ label, field, placeholder }) => (
          <div key={field} style={styles.fieldGroup}>
            <label style={styles.label}>{label}</label>
            <input style={styles.input} placeholder={placeholder}
              value={voucher[field] as string}
              onChange={(e) => setField(field, e.target.value)} />
          </div>
        ))}

        {paymentOption === "BANK" && reason === "PURCHASE" && (
          <>
            {[
              { label: "Số tài khoản ngân hàng *", field: "bankAccountNumber" as const },
              { label: "Tên tài khoản ngân hàng *", field: "bankName" as const },
            ].map(({ label, field }) => (
              <div key={field} style={styles.fieldGroup}>
                <label style={styles.label}>{label}</label>
                <input style={styles.input}
                  value={(voucher[field] as string) ?? ""}
                  onChange={(e) => setField(field, e.target.value)} />
              </div>
            ))}
          </>
        )}
      </section>

      <hr style={styles.hr} />

      {/* ── Chi tiết hàng hóa ── */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Chi tiết hàng hóa</h3>

        {voucher.items.length > 0 && (
          <InwardItemTable
            items={voucher.items}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
            warehouses={warehouses}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) =>
              goodsSearch.handleGoodsIdChange(index, value, voucher.items.length)
            }
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)
            }
            onSetDropdownPos={goodsSearch.setDropdownPos}
          />
        )}

        {voucher.items.length > 0 && (
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Tổng tiền hàng (chưa VAT):</span>
              <strong>{totalAmount.toLocaleString("vi-VN")} ₫</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Tổng thuế VAT:</span>
              <strong>{totalVat.toLocaleString("vi-VN")} ₫</strong>
            </div>
            <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
              <span>Tổng cộng:</span>
              <strong>{(totalAmount + totalVat).toLocaleString("vi-VN")} ₫</strong>
            </div>
          </div>
        )}
      </section>

      <hr style={styles.hr} />

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
        <button
          style={styles.btnSecondary}
          onClick={() => router.push("/dashboard/import")}
        >
          Hủy
        </button>
      </div>

      {message && (
        <p style={{
          ...styles.message,
          color: message.includes("thành công") ? "#16a34a" : "#cc2222",
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  voucherIdBadge: {
    marginLeft: 10,
    padding: "2px 10px",
    background: "#f0f4ff",
    color: "#2255cc",
    border: "1px solid #c7d7ff",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
  reasonSelect: {
    height: 38, padding: "0 36px 0 12px",
    border: "1.5px solid #c7d7ff", borderRadius: 8,
    background: "#eff6ff", color: "#2255cc",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
    minWidth: 220,
  },
  voucherCodeBadge: {
    padding: "4px 12px", background: "#f0f4ff", color: "#555",
    border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 12,
  },
};