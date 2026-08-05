import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Alyem Customs — Seguimiento aduanero',
  description: 'Alyem Customs: la agencia y sus clientes sobre una sola fuente de verdad.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icon-64.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} bg-background`}>
      <body className="antialiased font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=document.cookie.match(/(?:^|; )alyem_tema=(dark|light)/);var t=m?m[1]:localStorage.getItem('alyem:theme');var d=t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();",
          }}
        />
        {children}
        <Toaster richColors closeButton position="top-right" toastOptions={{ style: { fontSize: '13px' } }} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
