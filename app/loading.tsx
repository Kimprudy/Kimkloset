export default function Loading() {
  return (
    <div className="container-page py-16">
      <div className="skeleton h-10 w-56" />
      <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[3/4]" />
            <div className="skeleton mt-3 h-4 w-3/4" />
            <div className="skeleton mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
