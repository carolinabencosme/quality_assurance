import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/lib/brand';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${BRAND.name} - Inventario inteligente`,
  description: BRAND.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
