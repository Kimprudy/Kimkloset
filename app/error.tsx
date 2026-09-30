'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6" />}
        title="Something went wrong"
        message="Please try again. If it keeps happening, refresh the page."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={reset} className="btn-primary">Try again</button>
            <Link href="/" className="btn-outline">Go home</Link>
          </div>
        }
      />
    </div>
  );
}
