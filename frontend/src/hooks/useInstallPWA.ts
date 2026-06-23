import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

/**
 * Hook to manage PWA install prompt (Add to Home Screen).
 * Captures the beforeinstallprompt event and exposes an install() function.
 */
export function useInstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detect if already installed as a standalone PWA
    const mq = window.matchMedia('(display-mode: standalone)')
    setIsInstalled(mq.matches)

    const mediaQueryListener = (e: MediaQueryListEvent) => setIsInstalled(e.matches)
    mq.addEventListener('change', mediaQueryListener)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      mq.removeEventListener('change', mediaQueryListener)
    }
  }, [])

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  return { canInstall: !!installPrompt && !isInstalled, install, isInstalled }
}
