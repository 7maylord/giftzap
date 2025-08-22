'use client'

import { useState, useEffect } from 'react'
import { isAddress } from 'viem'
import { useGiftManagerWrite } from '@/hooks/useGiftManager'
import { CONTRACTS } from '@/lib/config'
import GiftManagerABI from '@/abi/GiftManager.json'
import { toast } from 'react-toastify'
import { Input } from './ui/input'

interface AddFavoriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddFavoriteModal({
  isOpen,
  onClose,
  onSuccess
}: AddFavoriteModalProps) {
  const [recipientAddress, setRecipientAddress] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasCheckedClipboard, setHasCheckedClipboard] = useState(false)

  const { writeContract: writeGiftManager } = useGiftManagerWrite()

  // Check clipboard for valid address when modal opens
  useEffect(() => {
    if (isOpen && !hasCheckedClipboard && navigator.clipboard) {
      navigator.clipboard.readText()
        .then(text => {
          if (text && isAddress(text) && !recipientAddress) {
            setRecipientAddress(text)
            toast.info('📋 Found address in clipboard!')
          }
        })
        .catch(() => {
          // Silent fail - clipboard permission might not be granted
        })
        .finally(() => {
          setHasCheckedClipboard(true)
        })
    } else if (!isOpen) {
      setHasCheckedClipboard(false)
    }
  }, [isOpen, hasCheckedClipboard, recipientAddress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!recipientAddress.trim()) {
      toast.error('Please enter a recipient address')
      return
    }

    if (!isAddress(recipientAddress)) {
      toast.error('Please enter a valid Ethereum address')
      return
    }

    if (!recipientName.trim()) {
      toast.error('Please enter a name for this favorite')
      return
    }

    if (recipientName.length > 31) {
      toast.error('Name must be 31 characters or less')
      return
    }

    setIsLoading(true)

    try {
      // Convert name to bytes32
      const nameBytes = new TextEncoder().encode(recipientName.trim())
      const nameBytes32 = new Uint8Array(32)
      nameBytes32.set(nameBytes.slice(0, 31)) // Ensure max 31 bytes for string
      const nameHex = '0x' + Array.from(nameBytes32)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      toast.info('Adding favorite. Please confirm the transaction in your wallet.')

      await writeGiftManager({
        address: CONTRACTS.GIFT_MANAGER,
        abi: GiftManagerABI,
        functionName: 'addFavorite',
        args: [recipientAddress, nameHex]
      })

      toast.success('✅ Favorite added successfully!')
      
      // Reset form
      setRecipientAddress('')
      setRecipientName('')
      
      // Call success callback and close modal
      onSuccess?.()
      onClose()

    } catch (error: unknown) {
      console.error('Adding favorite failed:', error)
      const err = error as { shortMessage?: string; message?: string }
      const errorMessage = err?.shortMessage || err?.message || 'Failed to add favorite'
      
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled')) {
        toast.info('Transaction cancelled')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setRecipientAddress('')
      setRecipientName('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto animate-scaleIn">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Add Favorite
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-500 hover:text-black transition-colors disabled:cursor-not-allowed"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Recipient Address *
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      if (isAddress(text)) {
                        setRecipientAddress(text)
                        toast.success('Address pasted!')
                      } else {
                        toast.error('Clipboard doesn\'t contain a valid address')
                      }
                    } catch {
                      toast.error('Unable to access clipboard')
                    }
                  }}
                  disabled={isLoading}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  📋 Paste
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Name *
              </label>
              <Input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. John Doe, Mom, Best Friend..."
                maxLength={31}
                className="w-full"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-600 mt-1">
                {recipientName.length}/31 characters
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">💡 Tip:</span> Adding someone as a favorite makes it easy to send them gifts later using the dropdown in the Send Gift form.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-black bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !recipientAddress.trim() || !recipientName.trim()}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <span>⭐</span>
                    Add Favorite
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}