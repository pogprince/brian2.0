import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Login — Brain',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
