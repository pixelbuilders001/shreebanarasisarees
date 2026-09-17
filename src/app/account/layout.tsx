import { Metadata } from 'next';
import AccountLayoutClient from './AccountLayoutClient';

export const metadata: Metadata = {
  title: 'My Account | Shree Banarasi Sarees',
  description: 'Manage your profile, orders, and saved addresses.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountLayoutClient>{children}</AccountLayoutClient>;
}
