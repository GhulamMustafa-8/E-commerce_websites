import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/shared/providers';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { AnnouncementBar } from '@/components/shared/announcement-bar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Souk — Modern Online Shopping in Pakistan',
    template: '%s | Souk',
  },
  description:
    'Shop fashion, electronics, home and beauty with fast delivery across Pakistan. Cash on delivery available.',
  metadataBase: new URL('https://souk.example'),
  openGraph: {
    title: 'Souk — Modern Online Shopping in Pakistan',
    description:
      'Shop fashion, electronics, home and beauty with fast delivery across Pakistan.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Souk — Modern Online Shopping in Pakistan',
    description:
      'Shop fashion, electronics, home and beauty with fast delivery across Pakistan.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <AnnouncementBar />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
