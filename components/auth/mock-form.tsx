export function MockLoginForm({ action, state }: { action: string; state: string }) {
  return (
    <form action={action} method="post" className="mx-auto mb-4 max-w-md rounded-2xl bg-white p-4 text-[#333] shadow-sm">
      <p className="m-0 text-[13px] font-semibold text-[#01665a]">Mode uji. Bukan Google sungguhan.</p>
      <input type="hidden" name="state" value={state} />
      <label className="mt-3 block text-[12px]">
        Email contoh
        <input name="email" type="email" required className="mt-1 w-full px-3 py-2" placeholder="nama@example.com" />
      </label>
      <label className="mt-3 block text-[12px]">
        Nama
        <input name="name" required className="mt-1 w-full px-3 py-2" placeholder="Nama contoh" />
      </label>
      <label className="mt-3 block text-[12px]">
        Subjek Google contoh
        <input name="sub" required className="mt-1 w-full px-3 py-2" placeholder="sub-contoh" />
      </label>
      <button type="submit" className="mt-3 min-h-10 rounded-xl bg-[#01665a] px-3 text-[13px] font-semibold text-white">
        Lanjutkan uji
      </button>
    </form>
  );
}
