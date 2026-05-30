"use client";

import { useEffect, useSyncExternalStore } from "react";

type SageUiSnapshot = {
  isThinking: boolean;
};

let snapshot: SageUiSnapshot = { isThinking: false };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setSageUiThinking(isThinking: boolean) {
  if (snapshot.isThinking === isThinking) return;
  snapshot = { isThinking };
  emit();
}

export function useSageUiThinking(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => snapshot.isThinking,
    () => false,
  );
}

/** Renders nothing; mirrors `isSending` for TopBar avatar ring (no API coupling) */
export function SageSendingMirror({ isSending }: { isSending: boolean }) {
  useEffect(() => {
    setSageUiThinking(isSending);
  }, [isSending]);

  useEffect(() => {
    return () => setSageUiThinking(false);
  }, []);

  return null;
}
