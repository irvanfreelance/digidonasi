"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function LogoutButton({
  tone = "header",
  showLabel = true,
  className,
}: {
  tone?: "header" | "sidebar";
  showLabel?: boolean;
  className?: string;
}) {
  const router = useRouter();

  if (tone === "sidebar") {
    return (
      <button
        type="button"
        onClick={() => router.push("/panel/login")}
        aria-label="Keluar"
        title="Keluar"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-3 text-[13px] font-semibold text-white hover:bg-white/25"
      >
        <LogOut size={16} />
        {showLabel ? "Keluar" : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.push("/panel/login")}
      className={cn(
        "ml-auto inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#ddd] bg-white px-3 text-[13px] font-semibold text-[#333]",
        className,
      )}
    >
      <LogOut size={16} />
      Keluar
    </button>
  );
}
