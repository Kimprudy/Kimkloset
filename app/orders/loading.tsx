export default function Loading() {
  return (
    <div className="container-page max-w-4xl py-12">
      <div className="skeleton h-12 w-56" />
      <div className="mt-8 space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-48" />
        ))}
      </div>
    </div>
  );
}
