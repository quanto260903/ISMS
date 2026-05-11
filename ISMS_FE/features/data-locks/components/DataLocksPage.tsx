"use client";

import { useEffect, useRef, useState } from "react";
import type { LockModule } from "../types/data-lock";
import type { LockState } from "../hooks/use-data-locks";
import { MODULE_META } from "../types/data-lock";
import { useDataLocks } from "../hooks/use-data-locks";
import { Toast } from "./Toast";

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

// ── Helpers ───────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Main Page ─────────────────────────────────────────────────
export function DataLocksPage() {
  const { states, actionLoading, toast, lock, unlock, fetchAll } = useDataLocks();
  const inventoryState = states.find((s) => s.module === "INVENTORY")!;

  const [showLockModal, setShowLockModal]     = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Khóa sổ: gọi API lock với ngày mới
  const handleLockSubmit = async (date: string, reason?: string) => {
    await lock("INVENTORY", date, reason);
    setShowLockModal(false);
  };

  // Bỏ khóa sổ: thực ra là cập nhật lại ngày khóa về ngày nhỏ hơn
  // → gọi unlock rồi lock lại với ngày mới, hoặc nếu API hỗ trợ patch thì gọi trực tiếp
  // Ở đây: unlock trước, nếu newDate có giá trị thì lock lại với ngày mới
  const handleUnlockSubmit = async (newDate: string, reason?: string) => {
    await unlock("INVENTORY");
    if (newDate) {
      await lock("INVENTORY", newDate, reason);
    }
    setShowUnlockModal(false);
  };

  if (!inventoryState) return null;

  const currentLockedDate = inventoryState.lock?.lockedUntilDate ?? null;

  return (
    <div style={s.page}>

      {/* ── Hero Banner ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb1} />
        <div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>WMS Pro · Quản lý hệ thống</div>
          <h1 style={s.heroTitle}>Khóa dữ liệu</h1>
          <p style={s.heroSub}>
            Kiểm soát và bảo vệ dữ liệu chứng từ — ngăn chỉnh sửa sau khi đã chốt sổ
          </p>
        </div>
        <div style={s.heroBadgeGroup}>
          <div style={s.heroBadge}>
            <span style={{ fontSize: 18 }}>{inventoryState.isLocked ? "🔒" : "🔓"}</span>
            <div>
              <div style={s.badgeNum}>{inventoryState.isLocked ? "Đang khóa" : "Chưa khóa"}</div>
              <div style={s.badgeLabel}>Kho hàng</div>
            </div>
          </div>
          <button style={s.btnRefreshHero} onClick={fetchAll} title="Làm mới">
            <span style={{ fontSize: 16 }}>↺</span>
            <span style={{ fontSize: 12 }}>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── Hướng dẫn ── */}
      <div style={s.guideCard}>
        <div style={s.guideIcon}>💡</div>
        <div>
          <div style={s.guideTitle}>Khóa sổ hoạt động như thế nào?</div>
          <div style={s.guideText}>
            Sau khi khóa sổ đến một ngày, <strong>toàn bộ chứng từ từ ngày đó trở về trước</strong> sẽ
            không thể tạo mới, sửa hoặc xóa trên mọi máy trạm. Để bỏ khóa một phần,
            hãy <strong>đặt lại ngày khóa về ngày sớm hơn</strong> — vùng dữ liệu giữa hai ngày sẽ được mở.
          </div>
        </div>
      </div>

      {/* ── Module Card ── */}
      <ModuleCard
        state={inventoryState}
        actionLoading={actionLoading}
        onLock={() => setShowLockModal(true)}
        onUnlock={() => setShowUnlockModal(true)}
      />

      {/* ── Modals ── */}
      <LockModal
        open={showLockModal}
        loading={actionLoading === "INVENTORY"}
        currentLockedDate={currentLockedDate}
        onClose={() => setShowLockModal(false)}
        onSubmit={handleLockSubmit}
      />
      <UnlockModal
        open={showUnlockModal}
        loading={actionLoading === "INVENTORY"}
        currentLockedDate={currentLockedDate}
        onClose={() => setShowUnlockModal(false)}
        onSubmit={handleUnlockSubmit}
      />

      <Toast toast={toast} />
    </div>
  );
}

// ── Module Card ───────────────────────────────────────────────
function ModuleCard({
  state, actionLoading, onLock, onUnlock,
}: {
  state: LockState;
  actionLoading: LockModule | null;
  onLock: () => void;
  onUnlock: () => void;
}) {
  const { module, isLocked, lock, loading } = state;
  const meta   = MODULE_META[module];
  const isBusy = loading || actionLoading === module;

  return (
    <div style={{ ...cardS.card, borderTop: `3px solid ${isLocked ? "#ef4444" : meta.color}`, opacity: isBusy ? 0.75 : 1 }}>

      {/* Header */}
      <div style={cardS.header}>
        <div style={{ ...cardS.iconWrap, background: `${meta.color}15`, color: meta.color }}>
          <span style={{ fontSize: 22 }}>{meta.icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={cardS.moduleName}>{meta.label}</div>
          <div style={cardS.moduleCode}>{module}</div>
        </div>
        <div style={{
          ...cardS.statusPill,
          background: isLocked ? "#fef2f2" : "#f0fdf4",
          color:      isLocked ? "#dc2626" : "#16a34a",
          border:     `1.5px solid ${isLocked ? "#fecaca" : "#bbf7d0"}`,
        }}>
          <span style={{
            display: "inline-block", width: 7, height: 7, borderRadius: "50%",
            background: isLocked ? "#ef4444" : "#22c55e", marginRight: 5,
            boxShadow: isLocked ? "0 0 0 2px rgba(239,68,68,0.2)" : "0 0 0 2px rgba(34,197,94,0.2)",
          }} />
          {isLocked ? "Đang khóa" : "Chưa khóa"}
        </div>
      </div>

      {/* Body */}
      <div style={cardS.body}>
        {loading ? <SkeletonLoader /> : isLocked && lock ? <LockedInfo lock={lock} /> : <OpenInfo color={meta.color} />}
      </div>

      {/* Footer */}
      <div style={cardS.footer}>
        {isLocked ? (
          <>
            <div style={cardS.lockEffect}>
              🚫 Chứng từ ≤ {lock ? formatDate(lock.lockedUntilDate) : "—"} bị chặn thao tác
            </div>
            <button style={{ ...cardS.btn, ...cardS.btnUnlock }} disabled={isBusy} onClick={onUnlock}>
              {isBusy ? <Spinner /> : "📅"}{isBusy ? "Đang xử lý..." : "Bỏ khóa sổ"}
            </button>
          </>
        ) : (
          <>
            <div style={cardS.openHint}>Chưa có khóa sổ nào đang hoạt động</div>
            <button style={{ ...cardS.btn, ...cardS.btnLock }} disabled={isBusy} onClick={onLock}>
              {isBusy ? <Spinner /> : "🔒"}{isBusy ? "Đang xử lý..." : "Khóa sổ"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Locked Info ───────────────────────────────────────────────
function LockedInfo({ lock }: { lock: NonNullable<LockState["lock"]> }) {
  return (
    <div style={infoS.wrap}>
      <div style={infoS.dateBlock}>
        <div style={infoS.dateLabel}>Ngày khóa sổ hiện tại</div>
        <div style={infoS.dateValue}>{formatDate(lock.lockedUntilDate)}</div>
        <div style={infoS.dateHint}>Chứng từ từ ngày này trở về trước đang bị khóa</div>
      </div>
      <div style={infoS.divider} />
      <div style={infoS.metaGrid}>
        <div style={infoS.metaRow}>
          <span style={infoS.metaIcon}>👤</span>
          <div>
            <div style={infoS.metaLabel}>Người khóa</div>
            <div style={infoS.metaValue}>{lock.lockedByUserId}</div>
          </div>
        </div>
        <div style={infoS.metaRow}>
          <span style={infoS.metaIcon}>🕒</span>
          <div>
            <div style={infoS.metaLabel}>Thời gian khóa</div>
            <div style={infoS.metaValue}>{formatDateTime(lock.lockedAt)}</div>
          </div>
        </div>
        {lock.reason && (
          <div style={{ ...infoS.metaRow, gridColumn: "1 / -1" }}>
            <span style={infoS.metaIcon}>📝</span>
            <div>
              <div style={infoS.metaLabel}>Lý do</div>
              <div style={{ ...infoS.metaValue, color: "#475569", fontStyle: "italic" }}>"{lock.reason}"</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Open Info ─────────────────────────────────────────────────
function OpenInfo({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: 8 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${color}12`, border: `2px dashed ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✅</div>
      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>Chưa có khóa sổ</div>
      <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>
        Dữ liệu có thể tạo mới, chỉnh sửa<br />và xóa bình thường
      </div>
    </div>
  );
}

// ── Lock Modal — Khóa sổ kỳ kế toán ─────────────────────────
// Nhập ngày khóa mới (>= ngày hiện tại hoặc >= ngày khóa cũ nếu có)
function LockModal({ open, loading, currentLockedDate, onClose, onSubmit }: {
  open: boolean;
  loading: boolean;
  currentLockedDate: string | null;
  onClose: () => void;
  onSubmit: (date: string, reason?: string) => void;
}) {
  const [date, setDate]     = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr]       = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Ngày tối thiểu được chọn:
  // - Nếu đang có khóa: phải lớn hơn ngày khóa hiện tại (mở rộng vùng khóa)
  // - Nếu chưa khóa: từ hôm nay trở về trước đều hợp lệ (không giới hạn min)
  const minDate = currentLockedDate ?? undefined;

  useEffect(() => {
    if (open) { setDate(""); setReason(""); setErr(""); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  const submit = () => {
    if (!date) { setErr("Vui lòng chọn ngày khóa sổ."); return; }
    if (currentLockedDate && date <= currentLockedDate) {
      setErr(`Ngày khóa mới phải sau ngày khóa hiện tại (${formatDate(currentLockedDate)}).`);
      return;
    }
    onSubmit(date, reason.trim() || undefined);
  };

  if (!open) return null;

  return (
    <div style={modal.backdrop} onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div style={modal.box}>
        <div style={modal.header}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={modal.title}>Khóa sổ kỳ kế toán</span>
        </div>

        <div style={modal.body}>
          {/* Thông tin ngày khóa hiện tại nếu có */}
          {currentLockedDate && (
            <div style={modal.infoBox}>
              <span>📌</span>
              <span>Ngày khóa hiện tại: <strong>{formatDate(currentLockedDate)}</strong>. Ngày khóa mới phải <strong>sau</strong> ngày này.</span>
            </div>
          )}

          <div style={modal.field}>
            <label style={modal.label}>
              Chọn ngày khóa sổ mới <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              ref={inputRef}
              type="date"
              style={modal.input}
              min={minDate}
              value={date}
              onChange={(e) => { setDate(e.target.value); setErr(""); }}
            />
            <span style={modal.hint}>
              Chứng từ từ ngày này trở về trước sẽ không thể thêm, sửa, xóa.
            </span>
          </div>

          <div style={modal.field}>
            <label style={modal.label}>Lý do <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(không bắt buộc)</span></label>
            <textarea
              style={{ ...modal.input, resize: "vertical", minHeight: 68 } as React.CSSProperties}
              placeholder="Ví dụ: Chốt sổ kho tháng 6/2025..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {err && <div style={modal.err}>{err}</div>}
        </div>

        <div style={modal.footer}>
          <button style={modal.btnGhost} onClick={onClose} disabled={loading}>Hủy</button>
          <button
            style={{ ...modal.btnPrimary, background: "linear-gradient(135deg,#1e3a5f,#1e40af)", opacity: (!date || loading) ? 0.5 : 1 }}
            onClick={submit}
            disabled={loading || !date}
          >
            {loading ? <Spinner /> : "🔒"}{loading ? "Đang xử lý..." : "Thực hiện khóa sổ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Unlock Modal — Bỏ khóa sổ kỳ kế toán ────────────────────
// Nhập ngày mới TRƯỚC ngày khóa hiện tại → vùng từ ngày mới đến ngày cũ được bỏ khóa
function UnlockModal({ open, loading, currentLockedDate, onClose, onSubmit }: {
  open: boolean;
  loading: boolean;
  currentLockedDate: string | null;
  onClose: () => void;
  onSubmit: (newDate: string, reason?: string) => void;
}) {
  const [date, setDate]     = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr]       = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setDate(""); setReason(""); setErr(""); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  const submit = () => {
    if (!date) { setErr("Vui lòng chọn ngày khóa sổ mới."); return; }
    if (currentLockedDate && date >= currentLockedDate) {
      setErr(`Ngày phải trước ngày khóa hiện tại (${formatDate(currentLockedDate)}) để bỏ khóa một phần.`);
      return;
    }
    onSubmit(date, reason.trim() || undefined);
  };

  if (!open) return null;

  return (
    <div style={modal.backdrop} onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div style={modal.box}>
        <div style={modal.header}>
          <span style={{ fontSize: 20 }}>📅</span>
          <span style={modal.title}>Bỏ khóa sổ kỳ kế toán</span>
        </div>

        <div style={modal.body}>
          {/* Hiển thị ngày khóa hiện tại */}
          {currentLockedDate && (
            <div style={{ ...modal.infoBox, background: "#fef2f2", borderColor: "#fecaca" }}>
              <span>🔒</span>
              <span>Ngày khóa hiện tại: <strong>{formatDate(currentLockedDate)}</strong>.</span>
            </div>
          )}

          <div style={modal.field}>
            <label style={modal.label}>
              Đặt ngày khóa sổ về ngày <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              ref={inputRef}
              type="date"
              style={modal.input}
              // Phải chọn ngày trước ngày khóa hiện tại
              max={currentLockedDate
                ? new Date(new Date(currentLockedDate).getTime() - 86400000).toISOString().split("T")[0]
                : undefined}
              value={date}
              onChange={(e) => { setDate(e.target.value); setErr(""); }}
            />
            <span style={modal.hint}>
              {date && currentLockedDate
                ? `Dữ liệu từ ${formatDate(date)} đến ${formatDate(currentLockedDate)} sẽ được bỏ khóa.`
                : "Chọn ngày mới nhỏ hơn ngày khóa hiện tại — vùng giữa hai ngày sẽ được mở."}
            </span>
          </div>

          <div style={modal.field}>
            <label style={modal.label}>Lý do <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(không bắt buộc)</span></label>
            <textarea
              style={{ ...modal.input, resize: "vertical", minHeight: 68 } as React.CSSProperties}
              placeholder="Ví dụ: Điều chỉnh chứng từ kho tháng 5/2025..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {err && <div style={modal.err}>{err}</div>}
        </div>

        <div style={modal.footer}>
          <button style={modal.btnGhost} onClick={onClose} disabled={loading}>Hủy</button>
          <button
            style={{ ...modal.btnPrimary, background: "#dc2626", opacity: (!date || loading) ? 0.5 : 1 }}
            onClick={submit}
            disabled={loading || !date}
          >
            {loading ? <Spinner /> : "📅"}{loading ? "Đang xử lý..." : "Thực hiện"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton & Spinner ────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 10 }}>
      {[90, 60, 75].map((w, i) => (
        <div key={i} style={{ height: 14, borderRadius: 6, width: `${w}%`, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      ))}
    </div>
  );
}
function Spinner() {
  return <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />;
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:           { padding: 0, minHeight: "100vh", background: "#f8faff", fontFamily: FONT, display: "flex", flexDirection: "column", gap: 0 },
  heroBanner:     { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 60%, #2563eb 100%)", borderRadius: 14, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 8px 24px rgba(30,64,175,0.3)" },
  heroOrb1:       { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2:       { position: "absolute", bottom: -30, left: 100, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow:    { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle:      { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.3px" },
  heroSub:        { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4, marginBottom: 0 },
  heroBadgeGroup: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0, position: "relative", zIndex: 1 },
  heroBadge:      { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff" },
  badgeNum:       { fontWeight: 800, fontSize: 15, lineHeight: 1 },
  badgeLabel:     { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  btnRefreshHero: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 14px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer", fontFamily: FONT },
  guideCard:      { display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, marginBottom: 20 },
  guideIcon:      { fontSize: 20, flexShrink: 0, marginTop: 1 },
  guideTitle:     { fontWeight: 700, fontSize: 13, color: "#1e40af", marginBottom: 4 },
  guideText:      { fontSize: 13, color: "#3b82f6", lineHeight: 1.6 },
};

const cardS: Record<string, React.CSSProperties> = {
  card:       { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", fontFamily: FONT },
  header:     { display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid #f1f5f9" },
  iconWrap:   { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  moduleName: { fontWeight: 700, fontSize: 15, color: "#1e293b" },
  moduleCode: { fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em", marginTop: 2 },
  statusPill: { display: "flex", alignItems: "center", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
  body:       { flex: 1, padding: "14px 18px" },
  footer:     { padding: "12px 18px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  lockEffect: { fontSize: 11, color: "#dc2626", fontWeight: 600, background: "#fef2f2", padding: "4px 8px", borderRadius: 6, border: "1px solid #fecaca" },
  openHint:   { fontSize: 11, color: "#94a3b8" },
  btn:        { display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: FONT, transition: "opacity 0.15s" },
  btnLock:    { background: "linear-gradient(135deg, #1e3a5f, #1e40af)", color: "#fff" },
  btnUnlock:  { background: "#f8fafc", color: "#475569", border: "1.5px solid #e2e8f0" },
};

const infoS: Record<string, React.CSSProperties> = {
  wrap:      { display: "flex", flexDirection: "column", gap: 12 },
  dateBlock: { background: "linear-gradient(135deg, #fef2f2, #fff5f5)", border: "1.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", textAlign: "center" },
  dateLabel: { fontSize: 11, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  dateValue: { fontSize: 22, fontWeight: 800, color: "#dc2626", letterSpacing: "-0.5px" },
  dateHint:  { fontSize: 11, color: "#ef4444", opacity: 0.7, marginTop: 4 },
  divider:   { height: 1, background: "#f1f5f9" },
  metaGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  metaRow:   { display: "flex", alignItems: "flex-start", gap: 8 },
  metaIcon:  { fontSize: 14, flexShrink: 0, marginTop: 1 },
  metaLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 2 },
  metaValue: { fontSize: 12, color: "#1e293b", fontWeight: 600 },
};

const modal: Record<string, React.CSSProperties> = {
  backdrop:  { position: "fixed", inset: 0, background: "rgba(15,20,35,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" },
  box:       { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", width: "100%", maxWidth: 440, boxShadow: "0 20px 50px rgba(0,0,0,0.18)", overflow: "hidden" },
  header:    { display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" },
  title:     { fontSize: 16, fontWeight: 700, color: "#1e293b" },
  body:      { padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 },
  footer:    { display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px 18px" },
  field:     { display: "flex", flexDirection: "column", gap: 5 },
  label:     { fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
  hint:      { fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  input:     { width: "100%", fontFamily: FONT, fontSize: 14, color: "#1e293b", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", outline: "none", boxSizing: "border-box" },
  err:       { fontSize: 12, color: "#dc2626", padding: "7px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7 },
  infoBox:   { display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 13, color: "#1e40af" },
  btnGhost:  { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT },
  btnPrimary:{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, color: "#fff" },
};