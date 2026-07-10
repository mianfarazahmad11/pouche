import AdminGuard from "@/components/AdminGuard"
import AdminSidebar from "@/components/AdminSidebar"

export default async function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 lg:gap-5 pt-0 pb-6 md:pb-8 animate-in fade-in duration-500">
        <AdminSidebar />
        <main className="flex-1 min-w-0 glass px-3 sm:px-4 md:px-5 lg:px-6 pt-4 pb-3 sm:pb-4 md:pb-5 lg:pb-6 rounded-2xl md:rounded-3xl bg-card border border-border/50 shadow-sm">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
