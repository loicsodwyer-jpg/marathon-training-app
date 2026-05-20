import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

function OfflineStatusBadge() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200">
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      Offline mode
    </span>
  )
}

export default OfflineStatusBadge
