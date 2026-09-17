import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Bag | Shree Banarasi Sarees',
  description: 'View and manage items in your shopping bag.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
