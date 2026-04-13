"use client";

import React from "react";
import styles from "@/shared/styles/sale.styles";
import {
  INWARD_TABLE_COLUMNS,
  STOCK_BUCKET_LABELS,
} from "../constants/import.constants";
import type {
  DropdownPos,
  DropdownState,
  GoodsSearchResult,
  InwardItem,
} from "../types/import.types";

interface Props {
  items: InwardItem[];
  dropdowns: DropdownState[];
  dropdownPos: DropdownPos | null;
  dropdownRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onUpdateItem: (
    index: number,
    field: keyof InwardItem,
    value: unknown,
  ) => void;
  onRemoveItem: (index: number) => void;
  onGoodsIdChange: (index: number, value: string) => void;
  onInputFocus: (index: number, e: React.FocusEvent<HTMLInputElement>) => void;
  onSelectGoods: (
    index: number,
    goods: GoodsSearchResult,
    totalItems: number,
  ) => void;
  onSetDropdownPos: (pos: DropdownPos | null) => void;
  lockGoodsSelection?: boolean;
  showReturnMetadata?: boolean;
  viewOnly?: boolean;
}

export default function InwardItemTable({
  items,
  dropdowns,
  dropdownPos,
  dropdownRefs,
  inputRefs,
  onUpdateItem,
  onRemoveItem,
  onGoodsIdChange,
  onInputFocus,
  onSelectGoods,
  onSetDropdownPos,
  lockGoodsSelection = false,
  showReturnMetadata = false,
  viewOnly = false,
}: Props) {
  const setPromotion = (index: number, value: number) => {
    const clamped = Math.max(0, Math.min(value, 100));
    onUpdateItem(index, "promotion", clamped);
  };

  const rows = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !viewOnly || item.goodsId.trim() !== "");

  return (
    <>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={styles.itemTable}>
          <thead>
            <tr>
              {INWARD_TABLE_COLUMNS.map(({ label, w }) => (
                <th
                  key={label}
                  style={{
                    ...styles.itemTh,
                    width: w,
                    minWidth: w,
                    maxWidth: w,
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, index }, rowIndex) => {
              const dropdown = dropdowns[index] ?? {
                suggestions: [],
                loading: false,
                open: false,
              };
              const isEmpty = item.goodsId.trim() === "";
              const remainingReturnQty = Math.max(
                0,
                (item.soldQty ?? item.quantity) - (item.returnedQty ?? 0),
              );
              const canEnforceReturnLimit = typeof item.soldQty === "number";
              const lockPriceFields = lockGoodsSelection || viewOnly;

              return (
                <React.Fragment key={`${item.goodsId || "row"}-${index}`}>
                  <tr
                    style={{
                      background: isEmpty
                        ? "#fffbf0"
                        : rowIndex % 2 === 0
                          ? "#fff"
                          : "#f8f9ff",
                      opacity: isEmpty ? 0.7 : 1,
                    }}
                  >
                    <td
                      style={{
                        ...styles.itemTd,
                        textAlign: "center",
                        color: "#999",
                        width: 32,
                      }}
                    >
                      {isEmpty ? (
                        <span style={{ color: "#ccc" }}>-</span>
                      ) : (
                        rowIndex + 1
                      )}
                    </td>

                    <td style={{ ...styles.itemTd, width: 110 }}>
                      <div
                        style={{ position: "relative" }}
                        ref={(el) => {
                          dropdownRefs.current[index] = el;
                        }}
                      >
                        <input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          style={{
                            ...styles.inputTable,
                            paddingRight: dropdown.loading ? 26 : 6,
                            background: lockPriceFields ? "#f4f4f4" : "#fff",
                            color: lockPriceFields ? "#555" : "#1e293b",
                          }}
                          placeholder="Mã hàng..."
                          value={item.goodsId}
                          onChange={(e) => {
                            if (!viewOnly && !lockGoodsSelection) {
                              onGoodsIdChange(index, e.target.value);
                            }
                          }}
                          onFocus={(e) => {
                            if (!viewOnly && !lockGoodsSelection) {
                              onInputFocus(index, e);
                            }
                          }}
                          autoComplete="off"
                          readOnly={viewOnly || lockGoodsSelection}
                        />
                        {!viewOnly && !lockGoodsSelection && dropdown.loading && (
                          <span style={styles.spinner}>...</span>
                        )}
                      </div>
                    </td>

                    <td style={{ ...styles.itemTd, width: 160 }}>
                      <input
                        style={{
                          ...styles.inputTable,
                          background: "#f4f4f4",
                          color: "#555",
                        }}
                        value={item.goodsName}
                        readOnly
                        tabIndex={-1}
                        placeholder="Tự động điền"
                      />
                    </td>

                    <td style={{ ...styles.itemTd, width: 50 }}>
                      <input
                        style={{
                          ...styles.inputTable,
                          background: "#f4f4f4",
                          color: "#555",
                          textAlign: "center",
                        }}
                        value={item.unit}
                        readOnly
                        tabIndex={-1}
                      />
                    </td>

                    <td style={{ ...styles.itemTd, width: 70 }}>
                      <input
                        type="number"
                        min={1}
                        max={
                          showReturnMetadata && canEnforceReturnLimit
                            ? remainingReturnQty || undefined
                            : undefined
                        }
                        style={{
                          ...styles.inputTable,
                          textAlign: "right",
                          ...(viewOnly
                            ? { background: "#f4f4f4", color: "#555" }
                            : {}),
                        }}
                        value={item.quantity}
                        readOnly={viewOnly}
                        onChange={(e) => {
                          if (!viewOnly) {
                            onUpdateItem(
                              index,
                              "quantity",
                              Number(e.target.value),
                            );
                          }
                        }}
                        disabled={isEmpty || viewOnly}
                        tabIndex={isEmpty || viewOnly ? -1 : undefined}
                      />
                    </td>

                    <td style={{ ...styles.itemTd, width: 110 }}>
                      <input
                        type="number"
                        min={0}
                        style={{
                          ...styles.inputTable,
                          textAlign: "right",
                          background: lockPriceFields ? "#f4f4f4" : "#fff",
                          color: lockPriceFields ? "#555" : "#1e293b",
                        }}
                        value={item.unitPrice}
                        readOnly={viewOnly}
                        onChange={(e) => {
                          if (!viewOnly && !lockGoodsSelection) {
                            onUpdateItem(
                              index,
                              "unitPrice",
                              Number(e.target.value),
                            );
                          }
                        }}
                        disabled={isEmpty || lockGoodsSelection || viewOnly}
                        tabIndex={
                          isEmpty || lockGoodsSelection || viewOnly
                            ? -1
                            : undefined
                        }
                      />
                    </td>

                    <td style={{ ...styles.itemTd, width: 90 }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        style={{
                          ...styles.inputTable,
                          textAlign: "right",
                          background: lockPriceFields ? "#f4f4f4" : "#fff",
                          color: lockPriceFields ? "#555" : "#1e293b",
                        }}
                        value={item.promotion === 0 ? "" : item.promotion}
                        placeholder="0"
                        readOnly={viewOnly}
                        onChange={(e) => {
                          if (!viewOnly && !lockGoodsSelection) {
                            setPromotion(index, Number(e.target.value));
                          }
                        }}
                        disabled={isEmpty || lockGoodsSelection || viewOnly}
                        tabIndex={
                          isEmpty || lockGoodsSelection || viewOnly
                            ? -1
                            : undefined
                        }
                      />
                    </td>

                    <td
                      style={{
                        ...styles.itemTd,
                        width: 120,
                        textAlign: "right",
                        color: isEmpty ? "#ccc" : "#2255cc",
                        fontWeight: 700,
                      }}
                    >
                      {isEmpty ? "-" : item.amount1.toLocaleString("vi-VN")}
                    </td>

                    <td
                      style={{
                        ...styles.itemTd,
                        width: 52,
                        textAlign: "center",
                      }}
                    >
                      {!viewOnly && !isEmpty && (
                        <button
                          style={styles.btnDanger}
                          onClick={() => onRemoveItem(index)}
                        >
                          Xoá
                        </button>
                      )}
                    </td>
                  </tr>

                  {showReturnMetadata && !isEmpty && (
                    <tr>
                      <td
                        colSpan={INWARD_TABLE_COLUMNS.length}
                        style={{
                          ...styles.itemTd,
                          background: "#f8fafc",
                          borderTop: "none",
                        }}
                      >
                        <div style={s.metaGrid}>
                          <div style={s.metaBlock}>
                            <span style={s.metaLabel}>Nguồn bán</span>
                            <span style={s.metaValue}>
                              {item.sourceVoucherId ||
                                item.offsetVoucher ||
                                "--"}
                            </span>
                          </div>
                          <div style={s.metaBlock}>
                            <span style={s.metaLabel}>Dòng nguồn</span>
                            <span style={s.metaValue}>
                              {item.sourceVoucherDetailId ?? "--"}
                            </span>
                          </div>
                          <div style={s.metaBlock}>
                            <span style={s.metaLabel}>Bucket</span>
                            <span style={s.bucketBadge}>
                              {
                                STOCK_BUCKET_LABELS[
                                  item.stockBucket ?? "QUARANTINE"
                                ]
                              }
                            </span>
                          </div>
                          <div style={s.metaBlock}>
                            <span style={s.metaLabel}>Đã bán / đã trả</span>
                            <span style={s.metaValue}>
                              {typeof item.soldQty === "number"
                                ? `${item.soldQty.toLocaleString("vi-VN")} / ${(item.returnedQty ?? 0).toLocaleString("vi-VN")}`
                                : "--"}
                            </span>
                          </div>
                        </div>

                        <div style={s.inputGrid}>
                          <label style={s.inputLabel}>
                            Lý do trả hàng *
                            <input
                              style={{
                                ...s.metaInput,
                                ...(viewOnly
                                  ? {
                                      background: "#f8fafc",
                                      color: "#475569",
                                    }
                                  : {}),
                              }}
                              value={item.returnReason ?? ""}
                              readOnly={viewOnly}
                              onChange={(e) => {
                                if (!viewOnly) {
                                  onUpdateItem(
                                    index,
                                    "returnReason",
                                    e.target.value,
                                  );
                                }
                              }}
                              placeholder="VD: Khách đổi trả, hàng hư hỏng..."
                            />
                          </label>
                          <label style={s.inputLabel}>
                            Nguyên nhân lỗi *
                            <input
                              style={{
                                ...s.metaInput,
                                ...(viewOnly
                                  ? {
                                      background: "#f8fafc",
                                      color: "#475569",
                                    }
                                  : {}),
                              }}
                              value={item.rootCause ?? ""}
                              readOnly={viewOnly}
                              onChange={(e) => {
                                if (!viewOnly) {
                                  onUpdateItem(
                                    index,
                                    "rootCause",
                                    e.target.value,
                                  );
                                }
                              }}
                              placeholder="VD: Hết hạn, lỗi bảo quản, lỗi sản phẩm..."
                            />
                          </label>
                          <label style={s.inputLabel}>
                            Hạn dùng
                            <input
                              type="date"
                              style={{
                                ...s.metaInput,
                                ...(viewOnly
                                  ? {
                                      background: "#f8fafc",
                                      color: "#475569",
                                    }
                                  : {}),
                              }}
                              value={item.expiryDate ?? ""}
                              readOnly={viewOnly}
                              onChange={(e) => {
                                if (!viewOnly) {
                                  onUpdateItem(
                                    index,
                                    "expiryDate",
                                    e.target.value || null,
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {!lockGoodsSelection &&
        !viewOnly &&
        dropdownPos &&
        (() => {
          const dropdown = dropdowns[dropdownPos.index];
          if (!dropdown) return null;

          const hasResults = dropdown.open && dropdown.suggestions.length > 0;
          const isEmpty =
            dropdown.open &&
            !dropdown.loading &&
            dropdown.suggestions.length === 0 &&
            (items[dropdownPos.index]?.goodsId ?? "").trim() !== "";

          if (!hasResults && !isEmpty) return null;

          return (
            <div
              style={{
                position: "fixed",
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 99999,
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 6,
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              }}
            >
              {hasResults && (
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: "4px 0",
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {dropdown.suggestions.map((goods) => (
                    <li
                      key={goods.goodsId}
                      style={styles.dropdownItem}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLLIElement).style.background =
                          "#f0f4ff";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLLIElement).style.background =
                          "transparent";
                      }}
                      onMouseDown={() => {
                        onSelectGoods(dropdownPos.index, goods, items.length);
                        onSetDropdownPos(null);
                      }}
                    >
                      <span style={styles.dropdownId}>{goods.goodsId}</span>
                      <span style={styles.dropdownName}>{goods.goodsName}</span>
                      <span style={styles.dropdownMeta}>
                        {goods.unit} | Bán được:{" "}
                        {goods.itemOnHand.toLocaleString("vi-VN")}
                        {typeof goods.quarantineOnHand === "number"
                          ? ` | Cách ly: ${goods.quarantineOnHand.toLocaleString("vi-VN")}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {isEmpty && (
                <div style={{ padding: "10px 14px", fontSize: 13, color: "#999" }}>
                  Không tìm thấy sản phẩm
                </div>
              )}
            </div>
          );
        })()}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  metaBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
  },
  bucketBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #fbbf24",
    background: "#fffbeb",
    color: "#b45309",
    fontSize: 12,
    fontWeight: 700,
  },
  inputGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr",
    gap: 12,
  },
  inputLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "#334155",
  },
  metaInput: {
    width: "100%",
    height: 36,
    borderRadius: 8,
    border: "1px solid #dbe3f0",
    background: "#fff",
    padding: "0 12px",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
  },
};
