"use client";

export function ActionForm({
  action,
  label,
  fields,
  hidden,
}: {
  action: string;
  label: string;
  fields: { name: string; label: string; type?: string; defaultValue?: string }[];
  hidden?: Record<string, string>;
}) {
  return (
    <form
      className="grid gap-2 rounded-2xl border border-gray-100 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const body: Record<string, unknown> = { ...hidden };
        for (const [key, value] of Object.entries(data)) {
          body[key] = key === "amount" ? Number(value) : value;
        }
        if (action.endsWith("/tarik") && !body.idempotencyKey) body.idempotencyKey = crypto.randomUUID();
        void fetch(action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(() => window.location.reload());
      }}
    >
      {fields.map((field) => (
        <label key={field.name} className="grid gap-1 text-[12px] text-gray-600">
          {field.label}
          <input name={field.name} type={field.type || "text"} defaultValue={field.defaultValue} required className="min-h-11 rounded-xl border border-gray-200 px-3 text-[14px] text-gray-900" />
        </label>
      ))}
      <button className="min-h-11 rounded-xl bg-[#0E6B56] text-[13px] font-semibold text-white">{label}</button>
    </form>
  );
}
