import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Shree Banarasi Sarees',
  description: 'Secure checkout for your order at Shree Banarasi Sarees.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
