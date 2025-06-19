import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeInitializer } from '../components/ThemeInitializer';
import { ToastProvider } from '../components/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Provana KMS',
  description: 'Knowledge Management System Chatbot',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeInitializer>
          <ToastProvider>{children}</ToastProvider>
        </ThemeInitializer>
      </body>
    </html>
  );
}
