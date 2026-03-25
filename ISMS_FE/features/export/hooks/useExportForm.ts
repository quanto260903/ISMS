// ============================================================
//  features/export/hooks/useExportForm.ts
// ============================================================

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createExport, updateExport, getNextExportId } from "../export.api";
import type { ExportReason, ExportVoucher, ExportItem } from "../types/export.types";
import {
  getVoucherCodeByReason,
  getDebitAccountByReason,
  detectReasonFromCode,
  calcAmount,
} from "../constants/export.constants";

interface UseExportFormOptions {
  userId?:       string;
  userFullName?: string;
  initialData?:  ExportVoucher;
  onSuccess?:    () => void;
}

export function useExportForm({
  userId       = "",
  userFullName = "",
  initialData,
  onSuccess,
}: UseExportFormOptions = {}) {

  const isEditMode = !!initialData;

  const [reason,  setReason]  = useState<ExportReason>(
    isEditMode ? detectReasonFromCode(initialData?.voucherCode) : "IMPORT_RETURN"
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [voucher, setVoucher] = useState<ExportVoucher>(
    initialData ?? {
      voucherId:          "",
      voucherCode:        getVoucherCodeByReason("IMPORT_RETURN"),
      customerId:         "",
      customerName:       "",
      taxCode:            "",
      address:            "",
      voucherDescription: "",
      voucherDate:        new Date().toISOString().split("T")[0],
      items:              [],
    }
  );

  // Lấy mã phiếu xuất kho tiếp theo từ server (chỉ khi tạo mới)
  useEffect(() => {
    if (initialData) return;
    getNextExportId()
      .then((id) => setVoucher((prev) => ({ ...prev, voucherId: id })))
      .catch(() => {/* giữ rỗng nếu lỗi */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi initialData fetch xong (trang edit) → sync lại state
  useEffect(() => {
    if (!initialData) return;
    setVoucher(initialData);
    setReason(detectReasonFromCode(initialData.voucherCode));
  }, [initialData?.voucherId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Field helpers ─────────────────────────────────────────
  const setField = <K extends keyof ExportVoucher>(field: K, value: ExportVoucher[K]) =>
    setVoucher((prev) => ({ ...prev, [field]: value }));

  const handleReasonChange = (r: ExportReason) => {
    setReason(r);
    setVoucher((prev) => ({ ...prev, voucherCode: getVoucherCodeByReason(r) }));
  };

  // ── Items ─────────────────────────────────────────────────
  const createEmptyItem = (r: ExportReason): ExportItem => ({
    goodsId:         "",
    goodsName:       "",
    unit:            "",
    quantity:        1,
    unitPrice:       0,
    amount1:         0,
    debitAccount1:   getDebitAccountByReason(r),
    creditAccount1:  "156",
    debitAccount2:   "",
    creditAccount2:  "",
    costPerUnit:     0,
    userId:          userId,
    createdDateTime: new Date().toISOString(),
    offsetVoucher:   "",
  });

  const reasonRef = useRef(reason);
  reasonRef.current = reason;

  const addItem = () =>
    setVoucher((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem(reasonRef.current)],
    }));

  // ── removeItem: luôn giữ placeholder cuối — giống useInwardForm ──
  const removeItem = (index: number) =>
    setVoucher((prev) => {
      const next = prev.items.filter((_, i) => i !== index);
      const lastIsEmpty = next.length > 0 && next[next.length - 1].goodsId.trim() === "";
      return {
        ...prev,
        items: next.length === 0 || !lastIsEmpty
          ? [...next, createEmptyItem(reasonRef.current)]
          : next,
      };
    });

  const updateItem = (index: number, field: keyof ExportItem, value: unknown) => {
    setVoucher((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      items[index].amount1 = calcAmount(items[index]);
      return { ...prev, items };
    });
  };

  const replaceAllItems = (newItems: ExportItem[]) =>
    setVoucher((prev) => ({ ...prev, items: newItems }));

  // ── filledItems: filter thay vì slice — giống useInwardForm ──
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
    if (!voucher.customerName.trim()) return "Chưa nhập tên đối tượng";
    if (!voucher.voucherDate)         return "Chưa chọn ngày xuất kho";
    if (filledItems.length === 0)     return "Chưa có hàng hóa nào";

    for (const item of filledItems) {
      const label = item.goodsName || item.goodsId;
      if (item.quantity <= 0)
        return `Dòng "${label}": Số lượng phải lớn hơn 0`;
      if (item.unitPrice < 0)
        return `Dòng "${label}": Đơn giá không hợp lệ`;
      // Bắt buộc có offsetVoucher — XK1/XK2 đều cần chứng từ đối trừ
      if (!item.offsetVoucher?.trim())
        return `Dòng "${label}": chưa chọn chứng từ nhập kho đối trừ`;
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
      debitAccount1:   item.debitAccount1,
      creditAccount1:  item.creditAccount1,
      debitAccount2:   item.debitAccount2,
      creditAccount2:  item.creditAccount2,
      costPerUnit:     item.costPerUnit,
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
        ? await updateExport(voucher.voucherId, payload)
        : await createExport(payload);

      if (result.isSuccess) {
        setMessage(isEditMode
          ? "Cập nhật phiếu xuất kho thành công"
          : "Tạo phiếu xuất kho thành công"
        );
        onSuccess?.();
      } else {
        setMessage(result.message || "Có lỗi xảy ra");
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return {
    voucher, reason, message, loading, isEditMode,
    totalAmount,
    setField, handleReasonChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  };
}