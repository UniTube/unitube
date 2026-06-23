import { useOnlineStatus } from '../hooks/useOnlineStatus'

/**
 * Displays a persistent banner when the user goes offline.
 * Disappears gracefully once the connection is restored.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus()

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2',
        'bg-zinc-900 dark:bg-zinc-800 text-white text-sm font-medium py-2.5 px-4',
        'transition-transform duration-300 ease-in-out',
        isOnline ? 'translate-y-full' : 'translate-y-0',
      ].join(' ')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-yellow-400 shrink-0"
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span>You are offline — some features may not be available</span>
    </div>
  )
}
