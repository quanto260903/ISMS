// ============================================================
//  features/sale/components/AddSaleForm.tsx
//  Orchestrator: kết nối các hooks với UI components
// ============================================================

"use client";

import React, { useEffect } from "react";
import styles from "@/shared/styles/sale.styles";
import { PAYMENT_LABELS } from "../constants/sale.constants";
import { calcAmount } from "../constants/sale.constants";
import { useSaleForm }        from "../hooks/useSaleForm";
import { useGoodsSearch }     from "../hooks/useGoodsSearch";
import { useWarehouseReport } from "../hooks/useWarehouseReport";
import SaleItemTable          from "./SaleItemTable";
import WarehouseReportModal   from "./WarehouseReportModal";
import type { PaymentOption, GoodsSearchResult } from "../types/sale.types";

export default function AddSaleForm() {
  // Truyền userId từ auth context vào đây (thay "" bằng userId thực tế)
  const {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem,
    handleSubmit,
  } = useSaleForm(/* userId từ auth */);

  const { report, fetchReport, closeReport } = useWarehouseReport();

  // Khi user chọn 1 lô trong modal → điền ngược warehouseId + offsetVoucher vào dòng sản phẩm
  const handleSelectWarehouse = (
    itemIndex: number,
    row: import("../types/sale.types").WarehouseTransactionDto
  ) => {
    updateItem(itemIndex, "creditWarehouseId", row.warehouseId ?? "");
    updateItem(itemIndex, "offsetVoucher",     row.offsetVoucher ?? "");
  };

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    const currentItem = voucher.items[index];
    const updated = {
      ...currentItem,
      goodsId:   goods.goodsId,
      goodsName: goods.goodsName,
      unit:      goods.unit,
      unitPrice: goods.salePrice,
    };
    updated.amount1 = calcAmount(updated);
    updateItem(index, "goodsId",   updated.goodsId);
    updateItem(index, "goodsName", updated.goodsName);
    updateItem(index, "unit",      updated.unit);
    updateItem(index, "unitPrice", updated.unitPrice);
  };

  const goodsSearch = useGoodsSearch({
    itemCount: voucher.items.length,
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem: addItem,
  });

  // Khởi tạo 1 dòng trống khi form load
  const initialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      addItem();
      initialized.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync dropdowns khi thêm / xóa item
  const prevLengthRef = React.useRef(voucher.items.length);
  useEffect(() => {
    const cur  = voucher.items.length;
    const prev = prevLengthRef.current;
    if (cur > prev) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Tạo đơn bán hàng</h2>

      {/* ── Hình thức thanh toán ── */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Hình thức thanh toán</h3>
        <div style={{ display: "flex", gap: 24 }}>
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
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Thông tin chứng từ</h3>

        {/* Các trường map 1-1 với backend */}
        {[
          { label: "Số chứng từ *",    field: "voucherId"          as const, placeholder: "Tự sinh, có thể sửa"   },
          { label: "Mã khách hàng *",  field: "customerId"         as const, placeholder: "Nhập mã khách hàng"    },
          { label: "Tên khách hàng *", field: "customerName"       as const, placeholder: "Nhập tên khách hàng"   },
          { label: "Mã số thuế",       field: "taxCode"            as const, placeholder: "Nhập mã số thuế"       },
          { label: "Địa chỉ *",        field: "address"            as const, placeholder: "Nhập địa chỉ"          },
          { label: "Diễn giải *",      field: "voucherDescription" as const, placeholder: "Nhập diễn giải"        },
        ].map(({ label, field, placeholder }) => (
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

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Ngày chứng từ *</label>
          <input
            type="date" style={styles.input}
            value={voucher.voucherDate}
            onChange={(e) => setField("voucherDate", e.target.value)}
          />
        </div>

        {/* Thông tin ngân hàng — chỉ hiện khi chọn BANK */}
        {paymentOption === "BANK" && (
          <>
            {[
              { label: "Số tài khoản ngân hàng *", field: "bankAccountNumber" as const, placeholder: "Nhập số tài khoản"  },
              { label: "Tên tài khoản ngân hàng *", field: "bankName"         as const, placeholder: "Nhập tên tài khoản" },
            ].map(({ label, field, placeholder }) => (
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
      </section>

      <hr style={styles.hr} />

      {/* ── Danh sách sản phẩm ── */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Danh sách sản phẩm</h3>

        {voucher.items.length > 0 && (
          <SaleItemTable
            items={voucher.items}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
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
            onSetDropdownOpen={(index, open) =>
              goodsSearch.dropdowns[index] !== undefined &&
              goodsSearch.setDropdownPos(open ? goodsSearch.dropdownPos : null)
            }
            onViewWarehouse={fetchReport}
          />
        )}

        {/* Tổng kết */}
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

      <button style={styles.btnPrimary} onClick={handleSubmit}>
        Lưu chứng từ
      </button>

      {message && (
        <p style={{ ...styles.message, color: message.includes("thành công") ? "green" : "red" }}>
          {message}
        </p>
      )}

      <WarehouseReportModal
        report={report}
        onClose={closeReport}
        onSelectWarehouse={handleSelectWarehouse}
      />
    </div>
  );
}