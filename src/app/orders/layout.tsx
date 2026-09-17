import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Orders | Shree Banarasi Sarees',
  description: 'View your orders and track shipment status.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
