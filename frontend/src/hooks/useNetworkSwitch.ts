'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useSwitchChain, useChainId } from 'wagmi'
import { mantleSepoliaTestnet } from 'wagmi/chains'
import { toast } from 'react-toastify'
import { rpcUrl } from '@/lib/config'

export function useNetworkSwitch() {
  const { address: _address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending, error } = useSwitchChain()
  const [hasPrompted, setHasPrompted] = useState(false)

  const isCorrectNetwork = chainId === mantleSepoliaTestnet.id
  const targetChainId = mantleSepoliaTestnet.id

  const switchToMantleSepoliaTestnet = useCallback(async () => {
    if (!switchChain || isPending) return

    try {
      setHasPrompted(true)
      toast.info('Switching to Mantle Sepolia Testnet...')
      
      await switchChain({ 
        chainId: targetChainId,
        addEthereumChainParameter: {
          chainName: mantleSepoliaTestnet.name,
          nativeCurrency: mantleSepoliaTestnet.nativeCurrency,
          rpcUrls: [rpcUrl],
          blockExplorerUrls: [mantleSepoliaTestnet.blockExplorers?.default?.url || 'https://sepolia.mantlescan.xyz']
        }
      })
      
      toast.success('Successfully switched to Mantle Sepolia Testnet!')
    } catch (err) {
      console.error('Failed to switch network:', err)
      toast.error('Failed to switch network. Please switch manually in your wallet.')
    }
  }, [switchChain, isPending, targetChainId, setHasPrompted])

  const promptNetworkSwitch = useCallback(() => {
    if (!isConnected || isCorrectNetwork || hasPrompted || isPending) return

    toast.warn('Wrong Network! Please switch to Mantle Sepolia Testnet to use this app.', {
        autoClose: false,
        closeOnClick: false,
        toastId: 'network-switch',
        onClick: switchToMantleSepoliaTestnet
      }
    )
  }, [isConnected, isCorrectNetwork, hasPrompted, isPending, switchToMantleSepoliaTestnet])

  // Auto-prompt when connected to wrong network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && !hasPrompted) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(promptNetworkSwitch, 1000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, isCorrectNetwork, hasPrompted, promptNetworkSwitch])

  // Reset prompt flag when network changes or user disconnects
  useEffect(() => {
    if (!isConnected || isCorrectNetwork) {
      setHasPrompted(false)
      toast.dismiss('network-switch')
    }
  }, [isConnected, isCorrectNetwork])

  // Handle switch chain errors
  useEffect(() => {
    if (error) {
      console.error('Network switch error:', error)
      toast.error('Network switch failed. Please try manually switching in your wallet.')
    }
  }, [error])

  return {
    isCorrectNetwork,
    switchToMantleSepoliaTestnet,
    isPending,
    targetChainId,
    currentChainId: chainId
  }
}