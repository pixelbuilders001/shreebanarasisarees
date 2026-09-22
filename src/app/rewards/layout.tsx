import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VIP Rewards Passbook | Shree Banarasi Sarees',
  description: 'View your exclusive store rewards balance and recent activity.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
