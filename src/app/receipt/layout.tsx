import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Receipt | Shree Banarasi Sarees',
  description: 'Order receipt and invoice details.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
