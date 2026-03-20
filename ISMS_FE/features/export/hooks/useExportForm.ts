// ============================================================
//  features/export/hooks/useExportForm.ts
//  Thêm: FIFO preview trước khi submit
// ============================================================

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createExport, updateExport, getFifoPreview } from "../export.api";
import type { FifoPreviewResult } from "../export.api";
import type { ExportReason, ExportVoucher, ExportItem } from "../types/export.types";
import {
  generateVoucherNumber,
  getVoucherCodeByReason,
  getDebitAccountByReason,
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

  const detectReason = (code?: string): ExportReason => {
    if (code === "XH1") return "IMPORT_RETURN";
    return "OTHER";
  };

  const [reason,  setReason]  = useState<ExportReason>(
    isEditMode ? detectReason(initialData?.voucherCode) : "OTHER"
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ── FIFO preview state ────────────────────────────────────
  // showFifoPreview = true khi user nhấn Lưu và có items không có offsetVoucher
  const [fifoPreview,     setFifoPreview]     = useState<FifoPreviewResult[]>([]);
  const [showFifoPreview, setShowFifoPreview] = useState(false);
  const [fifoLoading,     setFifoLoading]     = useState(false);

  const [voucher, setVoucher] = useState<ExportVoucher>(
    initialData ?? {
      voucherId:          generateVoucherNumber(),
      voucherCode:        getVoucherCodeByReason("OTHER"),
      customerId:         "",
      customerName:       "",
      taxCode:            "",
      address:            "",
      voucherDescription: userFullName ? `Người lập phiếu: ${userFullName}` : "",
      voucherDate:        new Date().toISOString().split("T")[0],
      bankName:           "",
      bankAccountNumber:  "",
      items:              [],
    }
  );

  useEffect(() => {
    if (!initialData) return;
    setVoucher(initialData);
    setReason(detectReason(initialData.voucherCode));
  }, [initialData?.voucherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = <K extends keyof ExportVoucher>(field: K, value: ExportVoucher[K]) =>
    setVoucher((prev) => ({ ...prev, [field]: value }));

  const handleReasonChange = (r: ExportReason) => {
    setReason(r);
    setVoucher((prev) => ({ ...prev, voucherCode: getVoucherCodeByReason(r) }));
  };

  // ── Items ─────────────────────────────────────────────────
  const createEmptyItem = (r: ExportReason): ExportItem => ({
    goodsId: "", goodsName: "", unit: "",
    quantity: 1, unitPrice: 0, amount1: 0, vat: 10, promotion: 0,
    debitAccount1:     getDebitAccountByReason(r),
    creditAccount1:    "156",
    creditWarehouseId: "",
    debitAccount2:     "3331",
    creditAccount2:    "156",
    userId:            userId,
    createdDateTime:   new Date().toISOString(),
    offsetVoucher:     "",
  });

  const reasonRef = useRef(reason);
  reasonRef.current = reason;

  const addItem = () =>
    setVoucher((prev) => ({
      ...prev, items: [...prev.items, createEmptyItem(reasonRef.current)],
    }));

  const removeItem = (index: number) =>
    setVoucher((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

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

  // ── Totals ────────────────────────────────────────────────
  const filledItems = useMemo(
    () => voucher.items.slice(0, -1),
    [voucher.items]
  );

  const totalAmount = useMemo(
    () => filledItems.reduce((s, i) => s + i.amount1, 0),
    [filledItems]
  );

  const totalVat = useMemo(
    () => filledItems.reduce((s, i) => s + i.amount1 * (i.vat / 100), 0),
    [filledItems]
  );

  // ── Validate ──────────────────────────────────────────────
  const validate = (): string | null => {
    if (!voucher.voucherId.trim())    return "Chưa có số phiếu";
    if (!voucher.customerName.trim()) return "Chưa nhập tên đối tượng";
    if (!voucher.voucherDate)         return "Chưa chọn ngày";
    if (filledItems.length === 0)     return "Chưa có hàng hóa nào";
    return null;
  };

  const buildPayload = () => ({
    voucherId:          voucher.voucherId,
    voucherCode:        voucher.voucherCode,
    customerId:         voucher.customerId,
    customerName:       voucher.customerName,
    taxCode:            voucher.taxCode,
    address:            voucher.address,
    voucherDescription: voucher.voucherDescription,
    voucherDate:        voucher.voucherDate,
    bankName:           voucher.bankName,
    bankAccountNumber:  voucher.bankAccountNumber,
    items: filledItems.map((item) => ({
      goodsId:           item.goodsId,
      goodsName:         item.goodsName,
      unit:              item.unit,
      quantity:          item.quantity,
      unitPrice:         item.unitPrice,
      amount1:           item.amount1,
      vat:               item.vat,
      promotion:         item.promotion,
      debitAccount1:     item.debitAccount1,
      creditAccount1:    item.creditAccount1,
      creditWarehouseId: item.creditWarehouseId,
      debitAccount2:     item.debitAccount2,
      creditAccount2:    item.creditAccount2,
      userId:            item.userId || userId,
      createdDateTime:   item.createdDateTime || new Date().toISOString(),
      offsetVoucher:     item.offsetVoucher || "",
    })),
  });

  // ══════════════════════════════════════════════════════════
  // SUBMIT FLOW:
  //
  // Bước 1 — handleSubmit (user nhấn "Lưu"):
  //   - Validate cơ bản
  //   - Kiểm tra items nào chưa có offsetVoucher
  //   - Nếu có → gọi getFifoPreview → hiện modal preview
  //   - Nếu không → gọi doSave() trực tiếp
  //
  // Bước 2 — confirmSave (user xác nhận trong modal preview):
  //   - Đóng modal
  //   - Gọi doSave()
  // ══════════════════════════════════════════════════════════
  const handleSubmit = async () => {
    const error = validate();
    if (error) { setMessage(error); return; }

    // Items hợp lệ (không tính dòng trống cuối)
    const itemsWithoutOffset = filledItems.filter(
      (i) => i.goodsId.trim() && !i.offsetVoucher?.trim()
    );

    if (itemsWithoutOffset.length > 0) {
      // Có items chưa chọn offsetVoucher → show FIFO preview
      setFifoLoading(true);
      setMessage("");
      try {
        const preview = await getFifoPreview(
          itemsWithoutOffset.map((i) => ({
            goodsId:   i.goodsId,
            goodsName: i.goodsName,
            quantity:  i.quantity,
          }))
        );
        setFifoPreview(preview);
        setShowFifoPreview(true);
      } catch {
        setMessage("Không thể tải preview FIFO, vui lòng thử lại");
      } finally {
        setFifoLoading(false);
      }
    } else {
      // Tất cả đã có offsetVoucher → lưu thẳng
      await doSave();
    }
  };

  // Xác nhận sau khi xem preview FIFO
  const confirmSave = async () => {
    setShowFifoPreview(false);
    setFifoPreview([]);
    await doSave();
  };

  // Hủy preview
  const cancelFifoPreview = () => {
    setShowFifoPreview(false);
    setFifoPreview([]);
  };

  const doSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = buildPayload();
      const result  = isEditMode
        ? await updateExport(voucher.voucherId, payload)
        : await createExport(payload);

      if (result.isSuccess) {
        setMessage(
          isEditMode
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
    // State
    voucher, reason, message, loading, isEditMode,
    totalAmount, totalVat,
    // FIFO preview
    fifoPreview, showFifoPreview, fifoLoading,
    // Actions
    setField, handleReasonChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,   // Bước 1: validate + preview
    confirmSave,    // Bước 2: xác nhận lưu sau preview
    cancelFifoPreview,
  };
}