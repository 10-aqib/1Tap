import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  )
}
