"use client";

import type { LockState } from "../hooks/use-data-locks";
import type { LockModule } from "../types/data-lock";
import { MODULE_META } from "../types/data-lock";

interface Props {
  state: LockState;
  actionLoading: LockModule | null;
  onLock: (module: LockModule) => void;
  onUnlock: (module: LockModule) => void;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateTime(dt: string) {
  const date = new Date(dt);
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ModuleCard({ state, actionLoading, onLock, onUnlock }: Props) {
  const { module, isLocked, lock, loading } = state;
  const meta = MODULE_META[module];
  const isBusy = loading || actionLoading === module;

  return (
    <div className={`module-card ${isLocked ? "module-card--locked" : "module-card--open"}`}>
      <div className="module-card__header">
        <div className="module-icon" style={{ background: `${meta.color}18`, color: meta.color }}>
          {meta.icon}
        </div>
        <div className="module-card__title-wrap">
          <span className="module-badge">{module}</span>
          <h3 className="module-name">{meta.label}</h3>
        </div>
        <div className={`module-status-dot ${isLocked ? "dot--locked" : "dot--open"}`} />
      </div>

      <div className="module-card__body">
        {loading ? (
          <div className="module-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--short" />
          </div>
        ) : isLocked && lock ? (
          <>
            <div className="lock-info-row">
              <span className="lock-info-label">Khóa đến</span>
              <span className="lock-info-value lock-info-value--date">
                {formatDate(lock.lockedUntilDate)}
              </span>
            </div>
            <div className="lock-info-row">
              <span className="lock-info-label">Người khóa</span>
              <span className="lock-info-value">{lock.lockedByUserId}</span>
            </div>
            <div className="lock-info-row">
              <span className="lock-info-label">Ngày khóa</span>
              <span className="lock-info-value">{formatDateTime(lock.lockedAt)}</span>
            </div>
            {lock.reason && (
              <div className="lock-reason">
                <span className="lock-reason__icon">📝</span>
                <span>{lock.reason}</span>
              </div>
            )}
          </>
        ) : (
          <div className="module-open-msg">
            <span className="module-open-icon">✅</span>
            <span>Module đang mở — dữ liệu có thể chỉnh sửa</span>
          </div>
        )}
      </div>

      <div className="module-card__footer">
        {isLocked ? (
          <button
            className="btn btn-unlock-sm"
            disabled={isBusy}
            onClick={() => onUnlock(module)}
          >
            {isBusy ? <span className="spinner spinner--sm" /> : "🔓"}
            Mở khóa
          </button>
        ) : (
          <button
            className="btn btn-lock-sm"
            disabled={isBusy}
            onClick={() => onLock(module)}
          >
            {isBusy ? <span className="spinner spinner--sm" /> : "🔒"}
            Khóa sổ
          </button>
        )}
        <div className={`module-status-tag ${isLocked ? "tag--locked" : "tag--open"}`}>
          {isLocked ? "🔴 Đang khóa" : "🟢 Đang mở"}
        </div>
      </div>
    </div>
  );
}
