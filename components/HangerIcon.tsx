/** Minimal hanger mark used next to the KIMKLOSET wordmark. */
export default function HangerIcon({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8.5V7a2.6 2.6 0 1 0-2.6-2.6" />
      <path d="M16 8.5 2.6 17.4a1.4 1.4 0 0 0 .8 2.6h25.2a1.4 1.4 0 0 0 .8-2.6L16 8.5Z" />
    </svg>
  );
}
