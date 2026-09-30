export default function Loading() {
  return (
    <div className="container-page py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="skeleton aspect-[3/4] lg:aspect-[4/5]" />
        <div className="space-y-4 lg:py-6">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
