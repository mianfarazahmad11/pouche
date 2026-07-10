import './globals.css'
import { Inter } from 'next/font/google'
import Toaster from '@/components/Toaster'
import { getSiteSettings } from '@/lib/siteSettings'
import AppChrome from '@/components/AppChrome'

const inter = Inter({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const settings = await getSiteSettings()
  return {
    title: `${settings.websiteName} | Premium E-Commerce`,
    description: 'Your one-stop shop for premium, aesthetic products.',
    icons: {
      icon: settings.faviconUrl || '/favicon.ico',
    },
  }
}

export default async function RootLayout({ children }) {
  const settings = await getSiteSettings()
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <Toaster />
        <AppChrome settings={settings}>{children}</AppChrome>
      </body>
    </html>
  )
}
