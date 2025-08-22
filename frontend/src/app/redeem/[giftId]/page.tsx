'use client'

import { use } from 'react'
import { useGetGift, useGiftManagerWrite } from '@/hooks/useGiftManager'
import { fetchGiftMetadata } from '@/utils/ipfs'
import { usePrivy } from '@privy-io/react-auth'
import { CONTRACTS } from '@/lib/config'
import GiftManagerABI from '@/abi/GiftManager.json'
import { useState, useEffect, useMemo } from 'react'
import { Gift } from '@/lib/types'
import { formatEther } from 'viem'
import { toast } from 'react-toastify'
import ConfettiAnimation from '@/components/ConfettiAnimation'
import Link from 'next/link'

interface GiftMetadata {
  giftType: string
  message: string
  timestamp: number
  sender?: string
}

export default function RedeemPage({ params }: { params: Promise<{ giftId: string }> }) {
  const resolvedParams = use(params)
  const giftId = parseInt(resolvedParams.giftId)
  const [giftMetadata, setGiftMetadata] = useState<GiftMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const { user, login, authenticated } = usePrivy()
  const { data: rawGift, isLoading, error } = useGetGift(giftId)
  const { writeContract } = useGiftManagerWrite()

  // Transform raw gift data to proper Gift interface
  const gift: Gift | undefined = useMemo(() => {
    if (!rawGift) return undefined
    
    // Type the raw gift as tuple from smart contract
    type RawGift = [string, string, bigint, string, string, boolean, boolean, bigint]
    const typedRawGift = rawGift as RawGift
    
    return {
      sender: typedRawGift[0] || '',
      recipient: typedRawGift[1] || '',
      amount: typedRawGift[2] || BigInt(0),
      giftTypeHash: typedRawGift[3] || '',
      messageHash: typedRawGift[4] || '',
      isCharity: typedRawGift[5] || false,
      redeemed: typedRawGift[6] || false,
      timestamp: typedRawGift[7] || BigInt(0)
    }
  }, [rawGift])

  useEffect(() => {
    async function loadGiftMetadata() {
      if (gift && gift.messageHash) {
        try {
          const metadata = await fetchGiftMetadata(gift.messageHash)
          setGiftMetadata(metadata)
        } catch (error) {
          console.error('Failed to load gift metadata:', error)
          toast.error('Failed to load gift details')
        }
      }
    }
    
    loadGiftMetadata()
  }, [gift])

  const handleRedeem = async () => {
    if (!authenticated || !user?.wallet?.address) {
      toast.error('Please connect your wallet to redeem')
      return
    }

    if (gift?.recipient !== user.wallet.address) {
      toast.error('This gift is not for you')
      return
    }

    if (gift?.redeemed) {
      toast.error('This gift has already been redeemed')
      return
    }

    setLoading(true)
    try {
      await writeContract({
        address: CONTRACTS.GIFT_MANAGER,
        abi: GiftManagerABI,
        functionName: 'redeemGift',
        args: [giftId],
      })
      
      setShowConfetti(true)
      toast.success('Gift redeemed successfully!')
    } catch (error) {
      console.error('Redemption failed:', error)
      toast.error('Failed to redeem gift')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-black">Loading gift...</p>
        </div>
      </div>
    )
  }

  if (error || !gift || !gift.amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-4">Gift Not Found</h1>
          <p className="text-black">This gift doesn&apos;t exist or has invalid data.</p>
        </div>
      </div>
    )
  }

  const isRecipient = authenticated && user?.wallet?.address === gift.recipient

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">🎁 You&apos;ve Received a Gift!</h1>
            <p className="text-black">Someone special has sent you a gift</p>
          </div>

          <div className="space-y-6">
            <div className="bg-secondary rounded-xl p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Gift Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-black">Amount:</span>
                  <span className="font-semibold text-black">
                    {formatEther(gift.amount)} MNT
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-black">From:</span>
                  <span className="font-mono text-sm text-black">
                    {gift.sender.slice(0, 6)}...{gift.sender.slice(-4)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-black">To:</span>
                  <span className="font-mono text-sm text-black">
                    {gift.recipient.slice(0, 6)}...{gift.recipient.slice(-4)}
                  </span>
                </div>
                
                {gift.isCharity && (
                  <div className="flex justify-between">
                    <span className="text-black">Type:</span>
                    <span className="font-semibold text-green-600">Charity Donation</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-black">Status:</span>
                  <span className={`font-semibold ${gift.redeemed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {gift.redeemed ? 'Redeemed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {giftMetadata && (
              <div className="bg-secondary rounded-xl p-6">
                <h3 className="text-lg font-semibold text-black mb-3">Personal Message</h3>
                <div className="space-y-2">
                  {giftMetadata.giftType && (
                    <div>
                      <span className="text-black">Gift Type: </span>
                      <span className="text-black font-medium">{giftMetadata.giftType}</span>
                    </div>
                  )}
                  {giftMetadata.message && (
                    <div>
                      <span className="text-black">Message: </span>
                      <p className="text-black italic mt-1">&quot;{giftMetadata.message}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-center">
              {!authenticated ? (
                <div>
                  <p className="text-black mb-4">Connect your wallet to redeem this gift</p>
                  <button 
                  onClick={login}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                    Connect Wallet
                  </button>
                </div>
              ) : !isRecipient ? (
                <div className="text-center space-y-4">
                  <p className="text-red-600 font-semibold text-lg">This gift doesn&apos;t belong to you</p>
                  <p className="text-black">
                    This gift is intended for a different wallet address.
                  </p>
                  <Link
                    href="/"
                    className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    Go to Homepage
                  </Link>
                </div>
              ) : gift.redeemed ? (
                <div>
                  <p className="text-green-600 font-semibold mb-4">✅ This gift has been redeemed!</p>
                  <p className="text-black">Thank you for using GiftZap</p>
                </div>
              ) : (
                <button
                  onClick={handleRedeem}
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Redeeming...' : 'Redeem Gift 🎉'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConfettiAnimation 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)}
        size={400}
      />
    </div>
  )
}