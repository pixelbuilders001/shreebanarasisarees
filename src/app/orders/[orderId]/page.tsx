import { redirect } from 'next/navigation';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/account?orderId=${encodeURIComponent(resolvedParams.orderId)}`);
}
