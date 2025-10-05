import './globals.css'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = { 
  title: 'MagicMenu', 
  description: 'Visualize your meal before you order.',
  viewport: 'width=device-width, initial-scale=1'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cherry+Cream+Soda&family=Spectral:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
