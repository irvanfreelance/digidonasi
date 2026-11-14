import { redirect } from 'next/navigation';

// Midtrans dashboard redirect lands here:
// /status?order_id=INV-...&status_code=200&transaction_status=settlement
// Forward to the proper dynamic route /status/[invoiceCode]
export default async function StatusRedirectPage(props: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const invoiceCode = searchParams.order_id;

  if (invoiceCode && invoiceCode.startsWith('INV-')) {
    redirect(`/status/${invoiceCode}`);
  }

  redirect('/donasi');
}
