export default function Loading() {
  return (
    <div className="container-page flex max-w-3xl flex-col items-center py-20 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="mt-6 font-display text-2xl font-semibold">Confirming your payment…</p>
      <p className="mt-2 text-sm text-ink/60">This only takes a moment. Please don&apos;t close this page.</p>
    </div>
  );
}
