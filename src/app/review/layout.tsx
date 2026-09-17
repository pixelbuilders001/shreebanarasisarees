import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Write a Review | Shree Banarasi Sarees',
  description: 'Share your feedback and review your purchase.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
