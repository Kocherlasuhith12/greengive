import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/8 rounded-full blur-[120px]" />
      </div>
      <nav className="relative z-10 p-6">
        <Link href="/" className="font-display text-xl font-bold gradient-text">
          GreenGive
        </Link>
      </nav>
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
