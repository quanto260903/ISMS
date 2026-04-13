"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "@/shared/styles/sale.styles";
import {
  DEFAULT_CREDIT_ACCOUNT,
  INWARD_REASON_LABELS,
  QUARANTINE_BUCKET,
  getVoucherCodeByReason,
} from "../constants/import.constants";
import { useInwardForm } from "../hooks/useInwardForm";
import { useGoodsSearch } from "../hooks/useGoodsSearch";
import { useSaleVoucherLookup } from "../hooks/useSaleVoucherLookup";
import { getSurplusItems } from "@/features/stock-take/stockTake.api";
import InwardItemTable from "./InwardItemTable";
import SupplierSearchInput from "@/shared/components/supplier/SupplierSearchInput";
import SupplierDropdown from "@/shared/components/supplier/SupplierDropdown";
import CreateSupplierModal from "@/shared/components/supplier/CreateSupplierModal";
import { useSupplierSearch } from "@/shared/hooks/supplier/useSupplierSearch";
import { useAuthStore } from "@/store/authStore";
import type {
  InwardItem,
  InwardReason,
  GoodsSearchResult,
} from "../types/import.types";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";

function createEmptyItem(userId: string): InwardItem {
  return {
    goodsId: "",
    goodsName: "",
    unit: "",
    quantity: 1,
    unitPrice: 0,
    amount1: 0,
    promotion: 0,
    debitAccount1: "156",
    creditAccount1: DEFAULT_CREDIT_ACCOUNT,
    debitAccount2: "1331",
    creditAccount2: DEFAULT_CREDIT_ACCOUNT,
    userId,
    createdDateTime: new Date().toISOString(),
  };
}

export default function AddInwardForm() {
  const searchParams = useSearchParams();
  const fromStockTakeId = searchParams.get("fromStockTake");
  const isFromStockTake =
    !!fromStockTakeId && searchParams.get("reason") === "NK3";

  const [reason, setReason] = useState<InwardReason>(
    isFromStockTake ? "STOCK_TAKE" : "PURCHASE",
  );
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierQuery, setSupplierQuery] = useState("");

  const { user } = useAuthStore();
  const currentUserId = String(user?.userId ?? "");
  const currentUserName = user?.fullName ?? "";
  const reasonRef = useRef(reason);
  reasonRef.current = reason;

  const {
    voucher,
    message,
    totalAmount,
    setField,
    handleReasonChange,
    addItem,
    removeItem,
    updateItem,
    replaceAllItems,
    handleSubmit,
  } = useInwardForm({ userId: currentUserId });

  const saleVoucherLookup = useSaleVoucherLookup();

  const handleSelectSupplier = (supplier: SupplierSearchResult) => {
    setField("customerId", supplier.supplierId);
    setField("customerName", supplier.supplierName);
    setField("taxCode", supplier.taxId ?? "");
    setField("address", supplier.address ?? "");
    setSupplierQuery(supplier.supplierId);
  };

  const supplierSearch = useSupplierSearch({ onSelect: handleSelectSupplier });

  const onReasonChange = (nextReason: InwardReason) => {
    setReason(nextReason);
    handleReasonChange(nextReason);
    saleVoucherLookup.clearLookup();
    setField("customerId", "");
    setField("customerName", "");
    setField("taxCode", "");
    setField("address", "");
    setField("voucherDescription", "");
    setSupplierQuery("");
    replaceAllItems(
      nextReason === "PURCHASE" ? [createEmptyItem(currentUserId)] : [],
    );
  };

  useEffect(() => {
    const result = saleVoucherLookup.lookupResult;
    if (!result || reasonRef.current !== "SALES_RETURN") return;

    setField("customerId", result.customerId ?? "");
    setField("customerName", result.customerName ?? "");
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);

    const newItems = result.items
      .map<InwardItem | null>((detail) => {
        const remainingQty = Math.max(detail.soldQty - detail.returnedQty, 0);
        if (remainingQty <= 0) return null;

        return {
          goodsId: detail.goodsId,
          goodsName: detail.goodsName,
          unit: detail.unit,
          quantity: remainingQty,
          unitPrice: detail.unitPrice,
          amount1:
            remainingQty *
            detail.unitPrice *
            (1 - (detail.promotion ?? 0) / 100),
          promotion: detail.promotion ?? 0,
          debitAccount1: "156",
          creditAccount1: DEFAULT_CREDIT_ACCOUNT,
          debitAccount2: "1331",
          creditAccount2: DEFAULT_CREDIT_ACCOUNT,
          stockBucket: QUARANTINE_BUCKET,
          offsetVoucher: result.voucherId,
          sourceVoucherId: result.voucherId,
          sourceVoucherDetailId: detail.saleVoucherDetailId,
          returnReason: "",
          rootCause: "",
          expiryDate: null,
          soldQty: detail.soldQty,
          returnedQty: detail.returnedQty,
          userId: currentUserId,
          createdDateTime: new Date().toISOString(),
        };
      })
      .filter((item): item is InwardItem => item !== null);

    replaceAllItems(newItems);
  }, [saleVoucherLookup.lookupResult]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isFromStockTake || !fromStockTakeId) return;

    handleReasonChange("STOCK_TAKE");
    setField(
      "voucherDescription",
      `Nhập kho kiểm kê - hàng thừa từ phiếu ${fromStockTakeId}`,
    );

    getSurplusItems(fromStockTakeId)
      .then((items) => {
        const newItems: InwardItem[] = items.map((item) => ({
          goodsId: item.goodsId,
          goodsName: item.goodsName,
          unit: item.unit ?? "",
          quantity: item.quantity,
          unitPrice: 0,
          amount1: 0,
          promotion: 0,
          debitAccount1: "156",
          creditAccount1: "3381",
          debitAccount2: "",
          creditAccount2: "",
          userId: currentUserId,
          createdDateTime: new Date().toISOString(),
        }));

        replaceAllItems(newItems);
      })
      .catch(() => {});
  }, [fromStockTakeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId", goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit", goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem: addItem,
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || isFromStockTake) return;

    addItem();
    initialized.current = true;
  }, [addItem, isFromStockTake]);

  const prevLengthRef = useRef(voucher.items.length);
  useEffect(() => {
    const currentLength = voucher.items.length;
    const previousLength = prevLengthRef.current;

    if (currentLength > previousLength) {
      for (let i = 0; i < currentLength - previousLength; i += 1) {
        goodsSearch.addDropdown();
      }
    }

    if (currentLength < previousLength) {
      goodsSearch.removeDropdown(currentLength);
    }

    prevLengthRef.current = currentLength;
  }, [goodsSearch, voucher.items.length]);

  const isSalesReturn = reason === "SALES_RETURN";

  return (
    <div style={styles.container}>
      <section style={s.sectionCard}>
        <h2 style={s.sectionTitle}>Thêm mới phiếu nhập khp</h2>

        {isFromStockTake ? (
          <div style={s.badgeRow}>
            <span style={s.staticBadge}>NK3 - Nhập kiểm kê</span>
            <span style={s.hintText}>Từ phiếu kiểm kê {fromStockTakeId}</span>
          </div>
        ) : (
          <div style={s.badgeRow}>
            <select
              value={reason}
              onChange={(event) =>
                onReasonChange(event.target.value as InwardReason)
              }
              style={s.reasonSelect}
            >
              {(["PURCHASE", "SALES_RETURN"] as InwardReason[]).map(
                (option) => (
                  <option key={option} value={option}>
                    {INWARD_REASON_LABELS[option]}
                  </option>
                ),
              )}
            </select>
            <span style={s.hintText}>
              Ma CT: <strong>{getVoucherCodeByReason(reason)}</strong>
            </span>
          </div>
        )}
      </section>

      {isSalesReturn && (
        <section style={s.sectionCard}>
          <h3 style={styles.sectionTitle}>Phiếu bán nguồn</h3>
          <div style={s.lookupRow}>
            <div style={{ ...styles.fieldGroup, flex: 1, marginBottom: 0 }}>
              <label style={styles.label}>Số phiếu bán *</label>
              <input
                style={styles.input}
                value={saleVoucherLookup.saleVoucherId}
                onChange={(event) =>
                  saleVoucherLookup.setSaleVoucherId(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") saleVoucherLookup.handleLookup();
                }}
                placeholder="Nhập số phiếu bán, vd: BH12345678"
              />
            </div>
            <button
              style={{ ...styles.btnPrimary, minWidth: 120 }}
              onClick={saleVoucherLookup.handleLookup}
              disabled={saleVoucherLookup.lookupLoading}
            >
              {saleVoucherLookup.lookupLoading ? "Đang tìm..." : "Tra cứu"}
            </button>
            {saleVoucherLookup.lookupResult && (
              <button
                style={styles.btnDanger}
                onClick={() => {
                  saleVoucherLookup.clearLookup();
                  setField("customerId", "");
                  setField("customerName", "");
                  setField("voucherDescription", "");
                  replaceAllItems([]);
                }}
              >
                Xoa
              </button>
            )}
          </div>

          {saleVoucherLookup.lookupError && (
            <p style={s.errorText}>{saleVoucherLookup.lookupError}</p>
          )}

          {saleVoucherLookup.lookupResult && (
            <div style={s.lookupInfo}>
              <strong>{saleVoucherLookup.lookupResult.voucherId}</strong>
              <span>Khách: {saleVoucherLookup.lookupResult.customerName}</span>
              <span>Dòng hợp lệ: {voucher.items.length}</span>
            </div>
          )}
        </section>
      )}

      <section style={s.sectionCard}>
        <h3 style={styles.sectionTitle}>Thông tin phiếu nhập</h3>

        <div style={s.formGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Số phiếu</label>
            <input
              style={{ ...styles.input, ...s.readonlyInput }}
              value={voucher.voucherId}
              readOnly
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Ngày nhập kho *</label>
            <input
              type="date"
              style={styles.input}
              value={voucher.voucherDate}
              onChange={(event) => setField("voucherDate", event.target.value)}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Người lập phiếu</label>
            <input
              style={{ ...styles.input, ...s.readonlyInput }}
              value={currentUserName}
              readOnly
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              {isSalesReturn ? "Mã khách hàng" : "Mã nhà cung cấp"}
            </label>
            {isSalesReturn ? (
              <input
                style={{ ...styles.input, ...s.readonlyInput }}
                value={voucher.customerId ?? ""}
                readOnly
                placeholder="Tự động điền từ phiếu bán"
              />
            ) : (
              <SupplierSearchInput
                value={supplierQuery}
                loading={supplierSearch.dropdown.loading}
                inputRef={supplierSearch.inputRef}
                onChange={(value) => {
                  setSupplierQuery(value);
                  setField("customerId", value);
                  supplierSearch.handleChange(value);
                }}
                onFocus={supplierSearch.handleFocus}
                onAddNew={() => setShowSupplierModal(true)}
                placeholder="Nhập mã NCC để tìm kiếm..."
              />
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              {isSalesReturn ? "Tên khách hàng *" : "Tên nhà cung cấp *"}
            </label>
            <input
              style={{
                ...styles.input,
                ...(isSalesReturn ? s.readonlyInput : {}),
              }}
              value={voucher.customerName ?? ""}
              readOnly={isSalesReturn}
              onChange={(event) => {
                if (!isSalesReturn)
                  setField("customerName", event.target.value);
              }}
              placeholder={
                isSalesReturn
                  ? "Tự động điền phiếu bán"
                  : "Tự động điền khi chọn NCC"
              }
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mã số thuế</label>
            <input
              style={styles.input}
              value={voucher.taxCode ?? ""}
              onChange={(event) => setField("taxCode", event.target.value)}
            />
          </div>

          <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Địa chỉ</label>
            <input
              style={styles.input}
              value={voucher.address ?? ""}
              onChange={(event) => setField("address", event.target.value)}
            />
          </div>

          <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Điện giải</label>
            <input
              style={styles.input}
              value={voucher.voucherDescription ?? ""}
              onChange={(event) =>
                setField("voucherDescription", event.target.value)
              }
            />
          </div>
        </div>
      </section>

      <section style={s.sectionCard}>
        <h3 style={styles.sectionTitle}>Chi tiết hàng hoá</h3>

        {voucher.items.length > 0 && (
          <InwardItemTable
            items={voucher.items}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) =>
              goodsSearch.handleGoodsIdChange(
                index,
                value,
                voucher.items.length,
              )
            }
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)
            }
            onSetDropdownPos={goodsSearch.setDropdownPos}
            lockGoodsSelection={isSalesReturn || isFromStockTake}
            showReturnMetadata={isSalesReturn}
          />
        )}

        <div style={styles.summaryBox}>
          <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
            <span>Tổng tiền hàng:</span>
            <strong>{totalAmount.toLocaleString("vi-VN")} VND</strong>
          </div>
        </div>
      </section>

      <div style={s.actionRow}>
        <button style={styles.btnPrimary} onClick={handleSubmit}>
          Lưu phiếu nhập kho
        </button>
        {message && (
          <span
            style={
              message.toLowerCase().includes("thành công")
                ? s.successText
                : s.errorText
            }
          >
            {message}
          </span>
        )}
      </div>

      <SupplierDropdown
        dropdown={supplierSearch.dropdown}
        dropdownPos={supplierSearch.dropdownPos}
        dropdownRef={supplierSearch.dropdownRef}
        onSelect={(supplier) => {
          handleSelectSupplier(supplier);
          supplierSearch.handleSelect(supplier);
        }}
        onAddNew={() => setShowSupplierModal(true)}
        query={supplierQuery}
      />

      {showSupplierModal && (
        <CreateSupplierModal
          initialId={supplierQuery}
          onClose={() => setShowSupplierModal(false)}
          onCreated={(supplier) => {
            handleSelectSupplier(supplier);
            setShowSupplierModal(false);
          }}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sectionCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    marginBottom: 16,
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  staticBadge: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#ecfdf5",
    border: "1px solid #86efac",
    color: "#15803d",
    fontWeight: 700,
    fontSize: 13,
  },
  hintText: {
    fontSize: 13,
    color: "#475569",
  },
  reasonSelect: {
    height: 40,
    minWidth: 240,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
    background: "#fff",
  },
  lookupRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  lookupInfo: {
    marginTop: 10,
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#f0fdf4",
    border: "1px solid #86efac",
    color: "#166534",
    fontSize: 13,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  readonlyInput: {
    background: "#f8fafc",
    color: "#475569",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  successText: {
    color: "#15803d",
    fontWeight: 600,
    fontSize: 13,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: 600,
    fontSize: 13,
  },
};
