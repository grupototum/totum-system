import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reusable guard for "você tem alterações não salvas" flows.
 * - Blocks tab close/refresh via `beforeunload` while dirty.
 * - Wraps any close/navigate action so it first asks for confirmation when dirty.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const guardedAction = useCallback((action: () => void) => {
    if (isDirty) {
      pendingAction.current = action;
      setConfirmOpen(true);
    } else {
      action();
    }
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    setConfirmOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }, []);

  const cancelDiscard = useCallback(() => {
    setConfirmOpen(false);
    pendingAction.current = null;
  }, []);

  return { confirmOpen, guardedAction, confirmDiscard, cancelDiscard };
}
