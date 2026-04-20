// ============================================================
//  features/export/components/SaleExportSection.tsx
//  Form bán hàng nhúng trong AddExportForm (reason = SALE).
//  Dùng cùng cơ chế chọn phiếu nhập FIFO như "Xuất hủy hàng".
// ============================================================

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import styles from "@/shared/styles/sale.styles";
import { PAYMENT_LABELS, getDebitAccountByPayment } from "@/features/sale/constants/sale.constants";
import { useSaleForm }     from "@/features/sale/hooks/useSaleForm";
import { useGoodsSearch }  from "../hooks/useGoodsSearch";
import { getWarehouseReport } from "../export.api";
import ExportItemTable     from "./ExportItemTable";
import SelectInboundModal  from "./SelectInboundModal";
import type { InboundSelection } from "./SelectInboundModal";
import type { GoodsSearchResult as ExportGoodsResult } from "../types/export.types";
import type { PaymentOption, VoucherItem } from "@/features/sale/types/sale.types";
import type { ExportItem } from "../types/export.types";

interface Props {
  userId:    string;
  userName:  string;
  onSuccess: () => void;
}

interface PendingGoodsState {
  itemIndex:  number;
  goods:      ExportGoodsResult;
  totalItems: number;
  inbounds:   InboundSelection[];
  loading:    boolean;
}

export default function SaleExportSection({ userId, userName, onSuccess }: Props) {
  const {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit: submitSale,
  } = useSaleForm(userId);

  // Ref luôn trỏ đúng giá trị mới nhất để tránh stale closure
  const paymentOptionRef = useRef(paymentOption);
  paymentOptionRef.current = paymentOption;
  const voucherDateRef = useRef(voucher.voucherDate);
  voucherDateRef.current = voucher.voucherDate;

  // ── Tạo dòng placeholder rỗng ─────────────────────────────
  const createEmptyItem = (): VoucherItem => ({
    goodsId:           "",
    goodsName:         "",
    unit:              "",
    quantity:          1,
    unitPrice:         0,
    amount2:           0,
    vat:               10,
    promotion:         0,
    amount1:           0,
    debitAccount1:     getDebitAccountByPayment(paymentOptionRef.current),
    creditAccount1:    "511",
    debitAccount2:     "632",
    creditAccount2:    "156",
    creditWarehouseId: "",
    offsetVoucher:     "",
    userId,
    createdDateTime:   new Date().toISOString(),
  });

  // ── Modal chọn phiếu nhập FIFO ────────────────────────────
  const [pendingGoods, setPendingGoods] = useState<PendingGoodsState | null>(null);

  const handleGoodsSelected = useCallback(async (
    index:      number,
    goods:      ExportGoodsResult,
    totalItems: number,
  ) => {
    setPendingGoods({ itemIndex: index, goods, totalItems, inbounds: [], loading: true });
    try {
      const rows = await getWarehouseReport(goods.goodsId, voucherDateRef.current || undefined);
      const inbounds: InboundSelection[] = rows
        .filter((r) => r.offsetVoucher && r.customInHand > 0)
        .map((r) => ({
          inboundVoucherCode: r.offsetVoucher!,
          allocatedQty:       0,
          warehouseId:        r.warehouseId,
          remainingQty:       r.customInHand,
          warehouseIn:        r.warehouseIn,
          warehouseOut:       r.warehouseOut,
          unitPrice:          r.unitPrice,
          costPerUnit:        r.warehouseIn > 0 ? r.cost / r.warehouseIn : 0,
          voucherDate:        r.voucherDate ?? null,
        }));
      setPendingGoods((prev) => prev ? { ...prev, inbounds, loading: false } : null);
    } catch {
      setPendingGoods((prev) => prev ? { ...prev, inbounds: [], loading: false } : null);
    }
  }, []);

  // Mở lại modal khi click vào dòng đã có hàng
  const handleRowClick = useCallback((index: number) => {
    const item = voucher.items[index];
    if (!item?.goodsId) return;
    const goods: ExportGoodsResult = {
      goodsId:    item.goodsId,
      goodsName:  item.goodsName,
      unit:       item.unit,
      salePrice:  item.unitPrice,
      vatrate:    "",
      itemOnHand: 0,
    };
    handleGoodsSelected(index, goods, voucher.items.length);
  }, [voucher.items, handleGoodsSelected]);

  // Xác nhận chọn phiếu nhập — điền ngược vào VoucherItem
  const handleConfirmInbound = useCallback((selections: InboundSelection[]) => {
    if (!pendingGoods) return;
    const { itemIndex, goods } = pendingGoods;

    replaceAllItems((() => {
      const items = [...voucher.items];

      selections.forEach((sel, i) => {
        const idx = itemIndex + i;
        if (i > 0) items.splice(idx, 0, createEmptyItem());

        const salePrice  = goods.salePrice > 0 ? goods.salePrice : sel.unitPrice;
        items[idx] = {
          ...items[idx],
          goodsId:           goods.goodsId,
          goodsName:         goods.goodsName,
          unit:              goods.unit,
          unitPrice:         salePrice,
          quantity:          sel.allocatedQty,
          amount1:           sel.allocatedQty * salePrice,        // doanh thu
          amount2:           sel.allocatedQty * sel.costPerUnit,  // giá vốn
          offsetVoucher:     sel.inboundVoucherCode,
          creditWarehouseId: sel.warehouseId ?? "",
          debitAccount1:     getDebitAccountByPayment(paymentOptionRef.current),
          creditAccount1:    "511",
          debitAccount2:     "632",
          creditAccount2:    "156",
        };
      });

      // Đảm bảo luôn có dòng placeholder cuối
      const last = items[items.length - 1];
      if (last.goodsId.trim() !== "") items.push(createEmptyItem());

      return items;
    })());

    setPendingGoods(null);
  }, [pendingGoods, voucher.items, replaceAllItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wrapper updateItem cho export's useGoodsSearch ────────
  const exportUpdateItem = useCallback(
    (index: number, field: keyof ExportItem, value: unknown) =>
      updateItem(index, field as keyof VoucherItem, value),
    [updateItem]
  );

  const goodsSearch = useGoodsSearch({
    updateItem:      exportUpdateItem,
    onSelectGoods:   (index, goods) => {
      updateItem(index, "goodsId",   goods.goodsId);
      updateItem(index, "goodsName", goods.goodsName);
      updateItem(index, "unit",      goods.unit);
    },
    onAddItem:       addItem,
    onGoodsSelected: handleGoodsSelected,
  });

  // Khởi tạo 1 dòng placeholder khi load
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) { addItem(); initialized.current = true; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync dropdowns theo số dòng
  const prevLengthRef = useRef(voucher.items.length);
  useEffect(() => {
    const cur = voucher.items.length, prev = prevLengthRef.current;
    if (cur > prev) for (let i = 0; i < cur - prev; i++) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gọi onSuccess sau khi submit thành công
  useEffect(() => {
    if (message.includes("thành công")) {
      const t = setTimeout(() => onSuccess(), 1500);
      return () => clearTimeout(t);
    }
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* ── Hình thức thanh toán ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Hình thức thanh toán</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(["CASH", "BANK", "UNPAID"] as PaymentOption[]).map((opt) => (
            <label key={opt} style={styles.radioLabel}>
              <input
                type="radio" value={opt}
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

      {/* ── Thông tin chứng từ ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin chứng từ</h3>
        <div style={s.twoCol}>

          {/* Cột trái */}
          <div style={s.colLeft}>
            {([
              { label: "Mã khách hàng *",  field: "customerId"         as const, placeholder: "Nhập mã khách hàng"   },
              { label: "Tên khách hàng *", field: "customerName"       as const, placeholder: "Nhập tên khách hàng"  },
              { label: "Mã số thuế",       field: "taxCode"            as const, placeholder: "Nhập mã số thuế"      },
              { label: "Địa chỉ *",        field: "address"            as const, placeholder: "Nhập địa chỉ"         },
              { label: "Diễn giải *",      field: "voucherDescription" as const, placeholder: "Nhập diễn giải"       },
            ] as const).map(({ label, field, placeholder }) => (
              <div key={field} style={styles.fieldGroup}>
                <label style={styles.label}>{label}</label>
                <input
                  style={styles.input}
                  placeholder={placeholder}
                  value={voucher[field] as string}
                  onChange={(e) => setField(field, e.target.value)}
                />
              </div>
            ))}

            {paymentOption === "BANK" && (
              <>
                {([
                  { label: "Số tài khoản ngân hàng *", field: "bankAccountNumber" as const, placeholder: "Nhập số tài khoản"  },
                  { label: "Tên tài khoản ngân hàng *", field: "bankName"         as const, placeholder: "Nhập tên tài khoản" },
                ] as const).map(({ label, field, placeholder }) => (
                  <div key={field} style={styles.fieldGroup}>
                    <label style={styles.label}>{label}</label>
                    <input
                      style={styles.input}
                      placeholder={placeholder}
                      value={(voucher[field] as string) ?? ""}
                      onChange={(e) => setField(field, e.target.value)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={s.divider} />

          {/* Cột phải */}
          <div style={s.colRight}>
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Số chứng từ *</label>
              <input
                style={{ ...styles.input, ...s.rightInput, fontWeight: 700, color: "#6d28d9", fontFamily: "monospace", background: "#f5f3ff", cursor: "default" }}
                value={voucher.voucherId}
                onChange={(e) => setField("voucherId", e.target.value)}
                placeholder="Tự sinh, có thể sửa"
              />
            </div>
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Ngày chứng từ *</label>
              <input type="date"
                style={{ ...styles.input, ...s.rightInput }}
                value={voucher.voucherDate}
                onChange={(e) => setField("voucherDate", e.target.value)}
              />
            </div>
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Người lập phiếu</label>
              <input
                style={{ ...styles.input, ...s.rightInput, background: "#f5f5f5", color: "#555" }}
                value={userName}
                readOnly
              />
            </div>
          </div>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* ── Chi tiết hàng hóa ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Chi tiết hàng hóa</h3>

        <div style={s.infoNote}>
          💡 Sau khi chọn mã hàng, hệ thống sẽ yêu cầu chọn <strong>phiếu nhập đối trừ</strong> và
          số lượng xuất từ mỗi phiếu theo nguyên tắc FIFO.
        </div>

        {voucher.items.length > 0 && (
          <ExportItemTable
            items={voucher.items as unknown as import("./ExportItemTable").ExportItemWithLot[]}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
            onUpdateItem={(index, field, value) =>
              updateItem(index, field as keyof VoucherItem, value)
            }
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) =>
              goodsSearch.handleGoodsIdChange(index, value)
            }
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)
            }
            onSetDropdownPos={goodsSearch.setDropdownPos}
            onRowClick={handleRowClick}
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
              <span>Tổng thanh toán:</span>
              <strong>{(totalAmount + totalVat).toLocaleString("vi-VN")} ₫</strong>
            </div>
          </div>
        )}
      </section>

      <hr style={styles.hr} />

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button style={styles.btnPrimary} onClick={submitSale}>
          💾 Lưu phiếu xuất bán hàng
        </button>
        {message && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13,
            background: message.includes("thành công") ? "#f0fdf4" : "#fff1f2",
            color:      message.includes("thành công") ? "#15803d" : "#b91c1c",
            border: `1.5px solid ${message.includes("thành công") ? "#bbf7d0" : "#fca5a5"}`,
          }}>
            {message.includes("thành công") ? "✅" : "⚠️"} {message}
          </div>
        )}
      </div>

      {/* ── Modal chọn phiếu nhập FIFO ── */}
      {pendingGoods && (
        <SelectInboundModal
          goodsId={pendingGoods.goods.goodsId}
          goodsName={pendingGoods.goods.goodsName}
          inbounds={pendingGoods.inbounds}
          loading={pendingGoods.loading}
          onConfirm={handleConfirmInbound}
          onCancel={() => setPendingGoods(null)}
          canCancel={true}
        />
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  card:       { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  cardTitle:  { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, marginTop: 0 },
  titleDot:   { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg, #6d28d9, #4f46e5)", flexShrink: 0 },
  infoNote:   { marginBottom: 12, padding: "10px 14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 12, color: "#0369a1", lineHeight: 1.6 },
  twoCol:     { display: "grid", gridTemplateColumns: "1fr auto 320px", gap: 0, alignItems: "flex-start", minWidth: 0 },
  colLeft:    { minWidth: 0, paddingRight: 20, overflow: "hidden" },
  divider:    { width: 1, alignSelf: "stretch", background: "#e2e8f0", margin: "0 4px" },
  colRight:   { width: 320, paddingLeft: 20, display: "flex", flexDirection: "column" as const, gap: 10, flexShrink: 0 },
  rightRow:   { display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 },
  rightLabel: { fontSize: 12, color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" as const, width: 140, flexShrink: 0 },
  rightInput: { flex: 1, minWidth: 0, border: "none", borderBottom: "1.5px solid #e2e8f0", borderRadius: 0, background: "transparent", padding: "4px 0", fontSize: 13, width: "100%", boxSizing: "border-box" as const },
};
