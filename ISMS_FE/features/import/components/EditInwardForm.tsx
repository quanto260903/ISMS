"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "@/shared/styles/sale.styles";
import { INWARD_VOUCHER_CODE_LABELS } from "../constants/import.constants";
import { useInwardForm } from "../hooks/useInwardForm";
import { useInwardDetail } from "../hooks/useInwardDetail";
import { useGoodsSearch } from "../hooks/useGoodsSearch";
import InwardItemTable from "./InwardItemTable";
import { useAuthStore } from "@/store/authStore";
import type { GoodsSearchResult } from "../types/import.types";

interface Props {
  voucherId: string;
  viewOnly?: boolean;
}

export default function EditInwardForm({
  voucherId,
  viewOnly = false,
}: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserId = String(user?.userId ?? "");
  const currentUserName = user?.fullName ?? "";

  const {
    data: initialData,
    loading: fetchLoading,
    error: fetchError,
  } = useInwardDetail(voucherId);

  const {
    voucher,
    message,
    loading,
    totalAmount,
    setField,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
  } = useInwardForm({
    userId: currentUserId,
    initialData: initialData ?? undefined,
    onSuccess: () => setTimeout(() => router.push("/dashboard/import"), 1200),
  });

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

  const prevLengthRef = React.useRef(voucher.items.length);
  React.useEffect(() => {
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

  const isSalesReturn = initialData?.voucherCode === "NK2";
  const isStockTake = initialData?.voucherCode === "NK3";
  const lockGoodsSelection = isSalesReturn || isStockTake;
  const voucherLabel =
    INWARD_VOUCHER_CODE_LABELS[initialData?.voucherCode ?? ""] ??
    initialData?.voucherCode ??
    "";

  if (fetchLoading) {
    return <div style={s.statusBox}>Đang tải phiếu nhập kho...</div>;
  }

  if (fetchError) {
    return (
      <div style={s.statusBox}>
        <div style={s.errorText}>{fetchError}</div>
        <button
          style={styles.btnSecondary}
          onClick={() => router.push("/dashboard/import")}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={s.headerRow}>
        <button
          style={styles.btnSecondary}
          onClick={() => router.push("/dashboard/import")}
        >
          Quay lại
        </button>
        <h2 style={s.pageTitle}>
          {viewOnly ? "Xem phieu nhap kho" : "Sua phieu nhap kho"}
          <span style={s.voucherBadge}>{voucherId}</span>
        </h2>
      </div>

      {viewOnly && (
        <div style={s.viewOnlyBanner}>
          Chế độ xen - không thể chỉnh sửa phiếu này
        </div>
      )}

      <section style={s.sectionCard}>
        <h3 style={styles.sectionTitle}>Loại phiếu</h3>
        <div style={s.infoRow}>
          <span style={s.typeBadge}>{voucherLabel}</span>
          <span style={s.infoText}>Mã CT: {voucher.voucherCode}</span>
        </div>
        {isSalesReturn && (
          <div style={s.noticeBox}>
            NK2 chỉ cho phép sửa thông tin nhắn hàng và lý do trả hàng trên
            các dòng đã được liên kết với phiếu trên bản gốc
          </div>
        )}
        {isStockTake && (
          <div style={s.noticeBox}>
            NK3 là phiếu nhập từ kiểm kê, thông tin hàng hoá được khoá để giữ
            nguyên số liệu đối chiếu.
          </div>
        )}
      </section>

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
              style={{
                ...styles.input,
                ...(viewOnly ? s.readonlyInput : {}),
              }}
              value={voucher.voucherDate}
              readOnly={viewOnly}
              onChange={(event) => {
                if (!viewOnly) {
                  setField("voucherDate", event.target.value);
                }
              }}
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
            <input
              style={{
                ...styles.input,
                ...((isSalesReturn || viewOnly) ? s.readonlyInput : {}),
              }}
              value={voucher.customerId ?? ""}
              readOnly={isSalesReturn || viewOnly}
              onChange={(event) => {
                if (!isSalesReturn && !viewOnly) {
                  setField("customerId", event.target.value);
                }
              }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              {isSalesReturn
                ? "Tên khách hàng *"
                : "Tên nhà cung cấp *"}
            </label>
            <input
              style={{
                ...styles.input,
                ...((isSalesReturn || viewOnly) ? s.readonlyInput : {}),
              }}
              value={voucher.customerName ?? ""}
              readOnly={isSalesReturn || viewOnly}
              onChange={(event) => {
                if (!isSalesReturn && !viewOnly) {
                  setField("customerName", event.target.value);
                }
              }}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mã số thuế</label>
            <input
              style={{
                ...styles.input,
                ...(viewOnly ? s.readonlyInput : {}),
              }}
              value={voucher.taxCode ?? ""}
              readOnly={viewOnly}
              onChange={(event) => {
                if (!viewOnly) {
                  setField("taxCode", event.target.value);
                }
              }}
            />
          </div>

          <div style={{ ...styles.fieldGroup, ...s.fullWidthField }}>
            <label style={styles.label}>Địa chỉ</label>
            <input
              style={{
                ...styles.input,
                ...(viewOnly ? s.readonlyInput : {}),
              }}
              value={voucher.address ?? ""}
              readOnly={viewOnly}
              onChange={(event) => {
                if (!viewOnly) {
                  setField("address", event.target.value);
                }
              }}
            />
          </div>

          <div style={{ ...styles.fieldGroup, ...s.fullWidthField }}>
            <label style={styles.label}>Diễn giải</label>
            <input
              style={{
                ...styles.input,
                ...(viewOnly ? s.readonlyInput : {}),
              }}
              value={voucher.voucherDescription ?? ""}
              readOnly={viewOnly}
              onChange={(event) => {
                if (!viewOnly) {
                  setField("voucherDescription", event.target.value);
                }
              }}
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
              goodsSearch.handleGoodsIdChange(index, value, voucher.items.length)
            }
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)
            }
            onSetDropdownPos={goodsSearch.setDropdownPos}
            lockGoodsSelection={lockGoodsSelection}
            showReturnMetadata={isSalesReturn}
            viewOnly={viewOnly}
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
        {!viewOnly && (
          <button
            style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        )}
        <button
          style={styles.btnSecondary}
          onClick={() => router.push("/dashboard/import")}
        >
          {viewOnly ? "Quay lại" : "Huỷ"}
        </button>
        {!viewOnly && message && (
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
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  statusBox: {
    padding: 40,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#1e293b",
  },
  voucherBadge: {
    marginLeft: 10,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 14,
  },
  viewOnlyBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    marginBottom: 12,
    background: "#fffbeb",
    border: "1.5px solid #fde68a",
    borderRadius: 8,
    fontSize: 13,
    color: "#92400e",
    fontWeight: 600,
  },
  sectionCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    marginBottom: 16,
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  typeBadge: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#334155",
    fontWeight: 700,
    fontSize: 13,
  },
  infoText: {
    fontSize: 13,
    color: "#475569",
  },
  noticeBox: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #fbbf24",
    background: "#fffbeb",
    color: "#92400e",
    fontSize: 13,
    fontWeight: 500,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  fullWidthField: {
    gridColumn: "1 / -1",
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
