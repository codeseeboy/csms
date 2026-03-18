export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-[#dc2626]">403</h1>
        <p className="mt-2 text-lg font-semibold text-foreground">Access Denied</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You do not have permission to access this page.
        </p>
      </div>
    </div>
  )
}
