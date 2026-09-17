import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline | Shree Banarasi Sarees',
  description: 'You are currently offline.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
