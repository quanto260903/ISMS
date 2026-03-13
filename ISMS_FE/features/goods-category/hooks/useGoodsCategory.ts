// ============================================================
//  features/goods-category/hooks/useGoodsCategory.ts
// ============================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getGoodsCategoryList, getGoodsCategoryById,
  createGoodsCategory, updateGoodsCategory,
  updateGoodsCategoryStatus, deleteGoodsCategory,
} from "../goodsCategory.api";
import type {
  GoodsCategoryListDto, GoodsCategoryDetailDto,
  CreateGoodsCategoryRequest, UpdateGoodsCategoryRequest,
} from "../types/goodsCategory.types";

interface Filters {
  keyword:    string;
  isInactive: string;  // "" | "false" | "true"
}

export function useGoodsCategory() {
  const PAGE_SIZE = 20;

  const [filters, setFilters]   = useState<Filters>({ keyword: "", isInactive: "false" });
  const [page, setPage]         = useState(1);
  const [items, setItems]       = useState<GoodsCategoryListDto[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [listError, setListErr] = useState("");

  type ModalMode = "create" | "edit" | "none";
  const [modalMode, setModalMode]       = useState<ModalMode>("none");
  const [selected, setSelected]         = useState<GoodsCategoryDetailDto | null>(null);
  const [detailLoading, setDetailLoad]  = useState(false);
  const [submitLoading, setSubmitLoad]  = useState(false);
  const [confirmDelete, setConfirmDel]  = useState<GoodsCategoryListDto | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Fetch list ────────────────────────────────────────────
  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setListErr("");
    try {
      const res = await getGoodsCategoryList({
        keyword:    f.keyword    || undefined,
        isInactive: f.isInactive !== "" ? f.isInactive === "true" : undefined,
        page:       p,
        pageSize:   PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      setListErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(filters, page); }, [filters, page, fetchList]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Open modals ───────────────────────────────────────────
  const openCreate = () => { setSelected(null); setModalMode("create"); };

  const openEdit = async (id: string) => {
    setDetailLoad(true);
    setModalMode("edit");
    try {
      const detail = await getGoodsCategoryById(id);
      setSelected(detail);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tải chi tiết", false);
      setModalMode("none");
    } finally {
      setDetailLoad(false);
    }
  };

  const closeModal = () => { setModalMode("none"); setSelected(null); };

  // ── Actions ───────────────────────────────────────────────
  const handleCreate = async (payload: CreateGoodsCategoryRequest) => {
    setSubmitLoad(true);
    try {
      await createGoodsCategory(payload);
      showToast("Tạo nhóm hàng thành công");
      closeModal();
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tạo nhóm hàng", false);
    } finally {
      setSubmitLoad(false);
    }
  };

  const handleUpdate = async (id: string, payload: UpdateGoodsCategoryRequest) => {
    setSubmitLoad(true);
    try {
      await updateGoodsCategory(id, payload);
      showToast("Cập nhật thành công");
      closeModal();
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi cập nhật", false);
    } finally {
      setSubmitLoad(false);
    }
  };

  const handleToggleStatus = async (item: GoodsCategoryListDto) => {
    try {
      const msg = await updateGoodsCategoryStatus(item.goodsGroupId, !item.isInactive);
      showToast(msg);
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi đổi trạng thái", false);
    }
  };

  const handleDelete = async (item: GoodsCategoryListDto) => {
    setSubmitLoad(true);
    try {
      const msg = await deleteGoodsCategory(item.goodsGroupId);
      showToast(msg);
      setConfirmDel(null);
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi xóa nhóm hàng", false);
      setConfirmDel(null);
    } finally {
      setSubmitLoad(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE, totalPages,
    items, total, loading, listError,
    modalMode, selected, detailLoading, submitLoading,
    confirmDelete, setConfirmDel,
    openCreate, openEdit, closeModal,
    handleCreate, handleUpdate, handleToggleStatus, handleDelete,
    toast,
  };
}