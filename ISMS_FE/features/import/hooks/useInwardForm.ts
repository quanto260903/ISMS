// ============================================================
//  features/inward/hooks/useInwardForm.ts
// ============================================================

"use client";

import { useState, useMemo, useEffect } from "react";
import { createInward, updateInward } from "../import.api";
import type { InwardVoucher, InwardItem, InwardReason } from "../types/import.types";
import {
  generateVoucherNumber,
  getVoucherCodeByReason,
  DEFAULT_CREDIT_ACCOUNT,
  calcAmount,
} from "../constants/import.constants";

interface UseInwardFormOptions {
  userId?:      string;
  initialData?: InwardVoucher;
  onSuccess?:   () => void;
}

export function useInwardForm({
  userId      = "",
  initialData,
  onSuccess,
}: UseInwardFormOptions = {}) {

  const isEditMode = !!initialData;

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Voucher state ─────────────────────────────────────────
  const [voucher, setVoucher] = useState<InwardVoucher>(
    initialData ?? {
      voucherId:          generateVoucherNumber(),
      voucherCode:        "NK1",
      customerId:         "",
      customerName:       "",
      taxCode:            "",
      address:            "",
      voucherDescription: "",
      voucherDate:        new Date().toISOString().split("T")[0],
      items:              [],
    }
  );

  // Khi initialData fetch xong (trang edit) → sync lại state
  useEffect(() => {
    if (!initialData) return;
    setVoucher(initialData);
  }, [initialData?.voucherId]);

  // ── Field helpers ─────────────────────────────────────────
  const setField = <K extends keyof InwardVoucher>(field: K, value: InwardVoucher[K]) =>
    setVoucher((prev) => ({ ...prev, [field]: value }));

  // ── Reason change — chỉ cập nhật voucherCode ─────────────
  const handleReasonChange = (reason: InwardReason) => {
    setVoucher((prev) => ({
      ...prev,
      voucherCode: getVoucherCodeByReason(reason),
    }));
  };

  // ── Items ─────────────────────────────────────────────────
  const createEmptyItem = (): InwardItem => ({
    goodsId:         "",
    goodsName:       "",
    unit:            "",
    quantity:        1,
    unitPrice:       0,
    amount1:         0,
    promotion:       0,
    debitAccount1:   "156",
    creditAccount1:  DEFAULT_CREDIT_ACCOUNT,   // 111 - tiền mặt
    debitAccount2:   "1331",
    creditAccount2:  DEFAULT_CREDIT_ACCOUNT,
    userId:          userId,
    createdDateTime: new Date().toISOString(),
  });

  const addItem = () =>
    setVoucher((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));

  const removeItem = (index: number) =>
    setVoucher((prev) => {
      const next = prev.items.filter((_, i) => i !== index);
      const lastIsEmpty = next.length > 0 && next[next.length - 1].goodsId.trim() === "";
      return {
        ...prev,
        items: next.length === 0 || !lastIsEmpty
          ? [...next, createEmptyItem()]
          : next,
      };
    });

  const updateItem = (index: number, field: keyof InwardItem, value: unknown) => {
    setVoucher((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      items[index].amount1 = calcAmount(items[index]);
      return { ...prev, items };
    });
  };

  const replaceAllItems = (newItems: InwardItem[]) =>
    setVoucher((prev) => ({ ...prev, items: newItems }));

  // ── filledItems: bỏ qua dòng placeholder khi submit ──────
  const filledItems = useMemo(
    () => voucher.items.filter((i) => i.goodsId.trim() !== ""),
    [voucher.items]
  );

  // ── Totals ────────────────────────────────────────────────
  const totalAmount = useMemo(
    () => filledItems.reduce((s, i) => s + i.amount1, 0),
    [filledItems]
  );

  // ── Validate ──────────────────────────────────────────────
  const validate = (): string | null => {
    if (!voucher.voucherId.trim())    return "Chưa có số phiếu";
    if (!voucher.customerName.trim()) return "Chưa nhập tên nhà cung cấp / khách hàng";
    if (!voucher.voucherDate)         return "Chưa chọn ngày nhập kho";
    if (filledItems.length === 0)     return "Chưa có hàng hóa nào";

    for (const item of filledItems) {
      const label = item.goodsName || item.goodsId;
      if (item.quantity <= 0)
        return `Dòng "${label}": Số lượng phải lớn hơn 0`;
      if (item.unitPrice <= 0)
        return `Dòng "${label}": Đơn giá phải lớn hơn 0`;
      if (item.promotion < 0 || item.promotion > 100)
        return `Dòng "${label}": Khuyến mãi phải từ 0 đến 100%`;
    }

    return null;
  };

  // ── Build payload ─────────────────────────────────────────
  const buildPayload = () => ({
    voucherId:          voucher.voucherId,
    voucherCode:        voucher.voucherCode,
    customerId:         voucher.customerId,
    customerName:       voucher.customerName,
    taxCode:            voucher.taxCode,
    address:            voucher.address,
    voucherDescription: voucher.voucherDescription,
    voucherDate:        voucher.voucherDate,
    items: filledItems.map((item) => ({
      goodsId:         item.goodsId,
      goodsName:       item.goodsName,
      unit:            item.unit,
      quantity:        item.quantity,
      unitPrice:       item.unitPrice,
      amount1:         item.amount1,
      promotion:       item.promotion,
      debitAccount1:   item.debitAccount1,
      creditAccount1:  item.creditAccount1,
      debitAccount2:   item.debitAccount2,
      creditAccount2:  item.creditAccount2,
      offsetVoucher:   item.offsetVoucher ?? null,
      userId:          item.userId || userId,
      createdDateTime: item.createdDateTime || new Date().toISOString(),
    })),
  });

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    const error = validate();
    if (error) { setMessage(error); return; }

    setLoading(true);
    setMessage("");
    try {
      const payload = buildPayload();
      const result  = isEditMode
        ? await updateInward(voucher.voucherId, payload)
        : await createInward(payload);

      if (result.isSuccess) {
        setMessage(isEditMode
          ? "Cập nhật phiếu nhập kho thành công"
          : "Tạo phiếu nhập kho thành công"
        );
        onSuccess?.();
      } else {
        setMessage(result.message || "Có lỗi xảy ra");
      }
    } catch {
      setMessage("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return {
    voucher, message, loading, isEditMode,
    totalAmount,
    setField, handleReasonChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  };
}