"use client";

export function JsonPost({ action, children, label }: { action: string; children: React.ReactNode; label: string }) {
  return (
    <form
      className="grid gap-2 rounded-2xl bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const body: Record<string, unknown> = { action };
        for (const [key, value] of Object.entries(data)) {
          body[key] = key === "minimumAmount" || key === "price" || key === "namesPerQty" || key === "qty" ? Number(value) : value;
        }
        void fetch("/api/panel/kampanye", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(() => window.location.reload());
      }}
    >
      <h2 className="m-0 text-[16px]">{label}</h2>
      {children}
      <button type="submit" className="min-h-11 rounded-xl bg-[var(--primary)] px-3 text-[13px] font-semibold text-white">
        Simpan
      </button>
    </form>
  );
}
