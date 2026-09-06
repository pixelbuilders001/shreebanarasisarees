import { redirect } from 'next/navigation';

export default async function OrdersRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const orderId = params?.orderId;
  if (orderId && typeof orderId === 'string') {
    redirect(`/account?orderId=${encodeURIComponent(orderId)}`);
  }
  redirect('/account');
}
