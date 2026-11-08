"use client";

import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui/button";

type ConfirmState = {
  message: string;
  confirmLabel: string;
  resolve: (value: boolean) => void;
};

let pending: ConfirmState | null = null;
const listeners = new Set<(state: ConfirmState | null) => void>();

function emit(state: ConfirmState | null) {
  pending = state;
  listeners.forEach((fn) => fn(state));
}

export function confirmAction(message: string, confirmLabel = "Ya"): Promise<boolean> {
  return new Promise((resolve) => {
    emit({ message, confirmLabel, resolve });
  });
}

export function ConfirmHost() {
  const [state, setState] = useState<ConfirmState | null>(pending);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  if (!state) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg" role="dialog" aria-modal="true">
        <p className="m-0 text-[14px] text-[#333]">{state.message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={`${btnSecondary} !text-white`} onClick={() => { state.resolve(false); emit(null); }}>
            Batal
          </button>
          <button type="button" className={btnPrimary} onClick={() => { state.resolve(true); emit(null); }}>
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
