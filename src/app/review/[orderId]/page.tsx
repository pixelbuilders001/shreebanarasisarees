import { redirect } from 'next/navigation';

interface ReviewOrderParamsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function ReviewOrderPage({ params }: ReviewOrderParamsPageProps) {
  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;
  redirect(`/review?orderId=${encodeURIComponent(orderId)}`);
}
