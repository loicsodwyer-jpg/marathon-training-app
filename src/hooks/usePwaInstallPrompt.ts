import { useEffect, useState } from 'react'

type InstallOutcome = 'accepted' | 'dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return 'prompt' in event && 'userChoice' in event
}

function getIsStandalone() {
  if (typeof window === 'undefined') {
    return false
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

function getIsIos() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function usePwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent>()
  const [isStandalone, setIsStandalone] = useState(getIsStandalone)
  const [lastOutcome, setLastOutcome] = useState<InstallOutcome>()
  const [isIos] = useState(getIsIos)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) {
        return
      }

      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleAppInstalled = () => {
      setInstallPrompt(undefined)
      setIsStandalone(true)
      setLastOutcome('accepted')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setLastOutcome(choice.outcome)

    if (choice.outcome === 'accepted') {
      setInstallPrompt(undefined)
      setIsStandalone(true)
    }
  }

  return {
    canInstall: Boolean(installPrompt) && !isStandalone,
    isIos,
    isStandalone,
    lastOutcome,
    promptInstall,
  }
}
