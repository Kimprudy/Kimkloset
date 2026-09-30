import { ShoppingBag } from 'lucide-react';

export default function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-3xl border border-dashed border-brand-300 bg-brand-50/60 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
        {icon ?? <ShoppingBag className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold">{title}</h3>
      {message && <p className="mt-2 text-sm text-ink/60">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
