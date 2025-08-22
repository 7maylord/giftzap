'use client'

import { useAccount, useChainId } from 'wagmi'
import { mantleSepoliaTestnet as _mantleSepoliaTestnet } from 'wagmi/chains'
import { useNetworkSwitch } from '@/hooks/useNetworkSwitch'

export default function NetworkIndicator() {
  const { isConnected } = useAccount()
  const _chainId = useChainId()
  const { isCorrectNetwork, switchToMantleSepoliaTestnet, isPending } = useNetworkSwitch()

  if (!isConnected) return null

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">Mantle Sepolia</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-200">
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <span className="text-sm">Wrong Network</span>
      <button
        onClick={switchToMantleSepoliaTestnet}
        disabled={isPending}
        className="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        {isPending ? 'Switching...' : 'Switch'}
      </button>
    </div>
  )
}