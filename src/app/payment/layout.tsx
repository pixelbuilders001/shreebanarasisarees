import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Status | Shree Banarasi Sarees',
  description: 'Payment status and transaction details.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
