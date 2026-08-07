import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FilsDesk | UAE Accounting, Billing & Inventory Management Suite',
  description: 'FilsDesk Enterprise ERP & POS Platform tailored for UAE SMEs - FTA VAT 201 Compliant, Double-Entry Engine, E-Invoicing, and Offline Desktop POS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
