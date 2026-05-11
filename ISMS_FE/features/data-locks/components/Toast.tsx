"use client";

interface Props {
  toast: { msg: string; type: "success" | "error" } | null;
}

export function Toast({ toast }: Props) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.type}`} role="alert" aria-live="polite">
      <span className="toast-icon">
        {toast.type === "success" ? "✅" : "❌"}
      </span>
      {toast.msg}
    </div>
  );
}
