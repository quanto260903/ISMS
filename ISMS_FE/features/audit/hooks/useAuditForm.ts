// ============================================================
//  features/audit/hooks/useAuditForm.ts
//  Quản lý state phiếu kiểm kê, tự tính chênh lệch + xử lý
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { createAuditVoucher }    from "../audit.api";
import type { AuditVoucher, AuditItem, AuditType } from "../types/audit.types";

function generateVoucherId(): string {
  const now   = new Date();
  const yy    = String(now.getFullYear()).slice(2);
  const mm    = String(now.getMonth() + 1).padStart(2, "0");
  const dd    = String(now.getDate()).padStart(2, "0");
  const rand  = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `KK${yy}${mm}${dd}${rand}`;
}

function deriveReasonAndAction(difference: number): {
  reason: string;
  action: string;
} {
  if (difference === 0) return { reason: "Khớp tồn kho",       action: "Khớp"     };
  if (difference > 0)   return { reason: "Thừa so với sổ sách", action: "Nhập kho" };
  return                       { reason: "Thiếu so với sổ sách", action: "Xuất kho" };
}

function createEmptyItem(): AuditItem {
  return {
    goodsId:        "",
    goodsName:      "",
    unit:           "",
    stockQuantity:  0,
    actualQuantity: 0,
    difference:     0,
    reason:         "",
    action:         "",
  };
}

interface Options {
  userId:       string;
  userFullName: string;
  onSuccess?:   () => void;
}

export function useAuditForm({ userId, userFullName, onSuccess }: Options) {
  const now = new Date();

  const [voucher, setVoucher] = useState<AuditVoucher>({
    voucherId:   generateVoucherId(),
    warehouseId: "",
    auditType:   "PARTIAL",
    description: "",
    auditDate:   now.toISOString().slice(0, 16), // "YYYY-MM-DDTHH:mm"
    createdBy:   userFullName,
    items:       [],
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Cập nhật field cấp phiếu ───────────────────────────
  const setField = useCallback(
    <K extends keyof AuditVoucher>(field: K, value: AuditVoucher[K]) => {
      setVoucher((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ── Thêm dòng trống ────────────────────────────────────
  const addItem = useCallback(() => {
    setVoucher((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  }, []);

  // ── Xóa dòng ───────────────────────────────────────────
  const removeItem = useCallback((index: number) => {
    setVoucher((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  // ── Cập nhật 1 field của 1 dòng ────────────────────────
  // Nếu actualQuantity thay đổi → tự tính difference, reason, action
  const updateItem = useCallback(
    (index: number, field: keyof AuditItem, value: unknown) => {
      setVoucher((prev) => {
        const items = prev.items.map((item, i) => {
          if (i !== index) return item;

          const updated = { ...item, [field]: value };

          // Tự tính chênh lệch khi actualQuantity hoặc stockQuantity đổi
          if (field === "actualQuantity" || field === "stockQuantity") {
            const diff = Number(updated.actualQuantity) - Number(updated.stockQuantity);
            const { reason, action } = deriveReasonAndAction(diff);
            return { ...updated, difference: diff, reason, action };
          }

          return updated;
        });
        return { ...prev, items };
      });
    },
    []
  );

  // ── Tổng hợp tab counts ────────────────────────────────
  const tabCounts = {
    total:   voucher.items.filter((i) => i.goodsId).length,
    matched: voucher.items.filter((i) => i.goodsId && i.difference === 0).length,
    surplus: voucher.items.filter((i) => i.goodsId && i.difference > 0).length,
    deficit: voucher.items.filter((i) => i.goodsId && i.difference < 0).length,
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!voucher.warehouseId) { setMessage("Vui lòng chọn kho kiểm kê"); return; }
    const validItems = voucher.items.filter((i) => i.goodsId.trim());
    if (validItems.length === 0) { setMessage("Vui lòng thêm ít nhất 1 hàng hóa"); return; }

    setLoading(true);
    setMessage("");
    try {
      const payload = { ...voucher, items: validItems, createdBy: userId };
      const res = await createAuditVoucher(payload);
      setMessage(res.message ?? (res.isSuccess ? "Lưu thành công" : "Có lỗi xảy ra"));
      if (res.isSuccess) onSuccess?.();
    } catch {
      setMessage("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }, [voucher, userId, onSuccess]);

  return {
    voucher, message, loading, tabCounts,
    setField, addItem, removeItem, updateItem,
    handleSubmit,
  };
}