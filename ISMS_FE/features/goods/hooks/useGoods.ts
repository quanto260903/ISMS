// ============================================================
//  features/goods/hooks/useGoods.ts
// ============================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getGoodsList, getGoodsById, createGoods,
  updateGoods, updateGoodsStatus, deleteGoods,
} from "../goods.api";
import { getGoodsCategoryList } from "@/features/goods-category/goodsCategory.api";
import type { GoodsListDto, GoodsDetailDto, CreateGoodsRequest, UpdateGoodsRequest } from "../types/goods.types";
import type { GoodsCategoryListDto } from "@/features/goods-category/types/goodsCategory.types";

interface Filters {
  keyword:      string;
  goodsGroupId: string;
  isInactive:   string;
  isPromotion:  string;
}

export function useGoods() {
  const PAGE_SIZE = 20;

  const [filters, setFilters]   = useState<Filters>({ keyword: "", goodsGroupId: "", isInactive: "false", isPromotion: "" });
  const [page, setPage]         = useState(1);
  const [items, setItems]       = useState<GoodsListDto[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [listError, setListErr] = useState("");

  // Category options for filter/form dropdowns
  const [categories, setCategories] = useState<GoodsCategoryListDto[]>([]);

  type ModalMode = "create" | "edit" | "none";
  const [modalMode, setModalMode]      = useState<ModalMode>("none");
  const [selected, setSelected]        = useState<GoodsDetailDto | null>(null);
  const [detailLoading, setDetailLoad] = useState(false);
  const [submitLoading, setSubmitLoad] = useState(false);
  const [confirmDelete, setConfirmDel] = useState<GoodsListDto | null>(null);
  const [toast, setToast]              = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Load categories once ──────────────────────────────────
  useEffect(() => {
    getGoodsCategoryList({ isInactive: false, pageSize: 200 })
      .then((r) => setCategories(r.items))
      .catch(() => {});
  }, []);

  // ── Fetch list ────────────────────────────────────────────
  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true); setListErr("");
    try {
      const res = await getGoodsList({
        keyword:      f.keyword      || undefined,
        goodsGroupId: f.goodsGroupId || undefined,
        isInactive:   f.isInactive   !== "" ? f.isInactive   === "true" : undefined,
        isPromotion:  f.isPromotion  !== "" ? f.isPromotion  === "true" : undefined,
        page: p, pageSize: PAGE_SIZE,
      });
      setItems(res.items); setTotal(res.total);
    } catch (e: unknown) {
      setListErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(filters, page); }, [filters, page, fetchList]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((p) => ({ ...p, [field]: value })); setPage(1);
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => { setSelected(null); setModalMode("create"); };

  const openEdit = async (id: string) => {
    setDetailLoad(true); setModalMode("edit");
    try { setSelected(await getGoodsById(id)); }
    catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tải chi tiết", false);
      setModalMode("none");
    } finally { setDetailLoad(false); }
  };

  const closeModal = () => { setModalMode("none"); setSelected(null); };

  const handleCreate = async (payload: CreateGoodsRequest) => {
    setSubmitLoad(true);
    try {
      await createGoods(payload);
      showToast("Tạo hàng hóa thành công");
      closeModal(); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tạo hàng hóa", false);
    } finally { setSubmitLoad(false); }
  };

  const handleUpdate = async (id: string, payload: UpdateGoodsRequest) => {
    setSubmitLoad(true);
    try {
      await updateGoods(id, payload);
      showToast("Cập nhật thành công");
      closeModal(); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi cập nhật", false);
    } finally { setSubmitLoad(false); }
  };

  const handleToggleStatus = async (item: GoodsListDto) => {
    try {
      const msg = await updateGoodsStatus(item.goodsId, !item.isInactive);
      showToast(msg); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi đổi trạng thái", false);
    }
  };

  const handleDelete = async (item: GoodsListDto) => {
    setSubmitLoad(true);
    try {
      const msg = await deleteGoods(item.goodsId);
      showToast(msg); setConfirmDel(null); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi xóa hàng hóa", false);
      setConfirmDel(null);
    } finally { setSubmitLoad(false); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE, totalPages,
    items, total, loading, listError,
    categories,
    modalMode, selected, detailLoading, submitLoading,
    confirmDelete, setConfirmDel,
    openCreate, openEdit, closeModal,
    handleCreate, handleUpdate, handleToggleStatus, handleDelete,
    toast,
  };
}