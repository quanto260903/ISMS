// hooks/useAutoLogout.ts
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAutoLogout() {
  const { token, logout } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp: number = payload.exp;
      const msLeft = exp * 1000 - Date.now() - 30_000;

      if (msLeft <= 0) {
        logout();
        window.location.href = '/login?reason=expired';
        return;
      }

      const timer = setTimeout(() => {
        logout();
        window.location.href = '/login?reason=expired';
      }, msLeft);

      return () => clearTimeout(timer);
    } catch {
      logout();
      window.location.href = '/login?reason=expired';
    }
  }, [token, logout]);
}