import Link from 'next/link';
import EmptyState from '@/components/EmptyState';

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        title="Page not found"
        message="This page or piece doesn't exist anymore."
        action={<Link href="/#shop" className="btn-primary">Back to the shop</Link>}
      />
    </div>
  );
}
