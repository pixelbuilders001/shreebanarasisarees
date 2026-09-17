import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | Shree Banarasi Sarees',
  description: 'View and manage your saved favourite sarees.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
