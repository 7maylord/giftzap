'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatEther, createPublicClient, http } from 'viem'
import { mantleSepoliaTestnet } from 'wagmi/chains'
import { useGiftManagerWrite } from '@/hooks/useGiftManager'
import { CONTRACTS } from '@/lib/config'
import GiftManagerABI from '@/abi/GiftManager.json'
import { toast } from 'react-toastify'
import AnimatedCard from './AnimatedCard'
import ConfettiAnimation from './ConfettiAnimation'
import QRCodeGenerator from './QRCodeGenerator'
import SocialShare from './SocialShare'

interface Gift {
  id: number
  sender: string
  recipient: string
  amount: bigint
  giftTypeHash: string
  messageHash: string
  isCharity: boolean
  redeemed: boolean
  timestamp: bigint
}

export default function GiftHistory() {
  const { address } = useAccount()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [expandedGifts, setExpandedGifts] = useState<Set<number>>(new Set())
  const { writeContract } = useGiftManagerWrite()

  const { data: giftCounter } = useReadContract({
    address: CONTRACTS.GIFT_MANAGER,
    abi: GiftManagerABI,
    functionName: 'giftCounter'
  })

  useEffect(() => {
    const fetchGifts = async () => {
      if (!giftCounter || !address) {
        setLoading(false)
        return
      }

      try {
        // Create a public client to make contract calls
        const publicClient = createPublicClient({
          chain: mantleSepoliaTestnet,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL)
        })

        const userGifts: Gift[] = []
        const counter = Number(giftCounter)
        
        console.log(`Fetching ${counter} gifts for user ${address}`)

        // Fetch gifts in batches to avoid overwhelming the RPC
        const batchSize = 10
        for (let start = 1; start <= counter; start += batchSize) {
          const end = Math.min(start + batchSize - 1, counter)
          const batch = []
          
          for (let i = start; i <= end; i++) {
            batch.push(
              publicClient.readContract({
                address: CONTRACTS.GIFT_MANAGER,
                abi: GiftManagerABI,
                functionName: 'gifts',
                args: [BigInt(i)]
              }).catch(() => null)
            )
          }
          
          const results = await Promise.allSettled(batch)
          
          results.forEach((result, index) => {
            const giftId = start + index
            if (result.status === 'fulfilled' && result.value) {
              const giftData = result.value as [string, string, bigint, string, string, boolean, boolean, bigint]
              
              const gift = {
                id: giftId,
                sender: giftData[0] as string,
                recipient: giftData[1] as string,
                amount: giftData[2] as bigint,
                giftTypeHash: giftData[3] as string,
                messageHash: giftData[4] as string,
                isCharity: giftData[5] as boolean,
                redeemed: giftData[6] as boolean,
                timestamp: giftData[7] as bigint
              }
              
              // Only include gifts where user is sender or recipient
              if (gift.sender.toLowerCase() === address.toLowerCase() || 
                  gift.recipient.toLowerCase() === address.toLowerCase()) {
                userGifts.push(gift)
              }
            }
          })
        }

        // Sort by most recent first
        userGifts.sort((a, b) => Number(b.timestamp - a.timestamp))
        
        console.log(`Found ${userGifts.length} gifts for user`)
        setGifts(userGifts)
      } catch (error) {
        console.error('Failed to fetch gifts:', error)
        toast.error('Failed to load gift history')
      } finally {
        setLoading(false)
      }
    }

    fetchGifts()
  }, [giftCounter, address])

  const handleRedeem = async (giftId: number) => {
    try {
      await writeContract({
        address: CONTRACTS.GIFT_MANAGER,
        abi: GiftManagerABI,
        functionName: 'redeemGift',
        args: [BigInt(giftId)]
      })
      
      setGifts(prev => prev.map(gift => 
        gift.id === giftId ? { ...gift, redeemed: true } : gift
      ))
      
      toast.success('Gift redeemed successfully!')
      setShowConfetti(true)
    } catch (error) {
      console.error('Redemption failed:', error)
      toast.error('Failed to redeem gift')
    }
  }

  const toggleGiftExpansion = (giftId: number) => {
    setExpandedGifts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(giftId)) {
        newSet.delete(giftId)
      } else {
        newSet.add(giftId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading gift history...</p>
      </div>
    )
  }

  if (gifts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Gift History Found</h3>
          <p className="text-gray-600 mb-4">
            {giftCounter && Number(giftCounter) > 0 
              ? "Your gifts might still be loading, or you haven't sent/received any gifts yet."
              : "Start sending or receiving gifts to see your history here!"
            }
          </p>
          <div className="text-sm text-gray-500">
            <p>• Send gifts to friends or charities</p>
            <p>• Receive gifts from others</p>
            <p>• Track all your gift transactions</p>
          </div>
          {Number(giftCounter || 0) > 0 && (
            <p className="text-xs text-gray-400 mt-4">
              Total gifts in system: {Number(giftCounter)}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📜</span>
        <h2 className="text-2xl font-bold text-gray-900">Your Gift History</h2>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {gifts.length} gift{gifts.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4">
        {gifts.map((gift, index) => {
          const isSender = gift.sender.toLowerCase() === address?.toLowerCase()
          const canRedeem = !isSender && !gift.redeemed
          const isExpanded = expandedGifts.has(gift.id)
          const redeemUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/redeem/${gift.id}`
          
          return (
            <AnimatedCard key={gift.id} delay={index * 100}>
              <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isSender 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isSender ? '📤 Sent' : '📥 Received'}
                    </span>
                    {gift.isCharity && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        ❤️ Charity
                      </span>
                    )}
                    {gift.redeemed && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        ✅ Redeemed
                      </span>
                    )}
                    {!gift.redeemed && !isSender && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        💎 Ready to Redeem
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatEther(gift.amount)}
                    </p>
                    <span className="text-lg font-medium text-gray-600">MNT</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">
                      {isSender ? 'To: ' : 'From: '}
                    </span>
                    <span className="font-mono">
                      {(isSender ? gift.recipient : gift.sender).slice(0, 6)}...
                      {(isSender ? gift.recipient : gift.sender).slice(-4)}
                    </span>
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      🕒 {new Date(Number(gift.timestamp) * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Gift ID: #{gift.id}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {canRedeem && (
                    <button
                      onClick={() => handleRedeem(gift.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>💎</span>
                      Redeem Gift
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleGiftExpansion(gift.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>{isExpanded ? '📱' : '🔗'}</span>
                    {isExpanded ? 'Hide Share' : 'Share Gift'}
                  </button>
                </div>
              </div>
              
              {/* Expanded section with QR and Social Share */}
              {isExpanded && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* QR Code Section */}
                    <div>
                      <h4 className="text-lg text-blue-600 font-semibold mb-4 text-center">📱 Scan to Redeem</h4>
                      <QRCodeGenerator
                        value={redeemUrl}
                        size={150}
                        title="Scan QR Code to Redeem Gift"
                        className="mx-auto"
                      />
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 text-center break-all">
                          {redeemUrl}
                        </p>
                      </div>
                    </div>
                    
                    {/* Social Share Section */}
                    <div>
                      <h4 className="text-lg text-blue-600 font-semibold mb-4 text-center">🔗 Share Gift</h4>
                      <SocialShare
                        giftId={gift.id.toString()}
                        giftAmount={formatEther(gift.amount)}
                        giftType="special"
                        message="You have a special gift waiting for you!"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        🎁 Gift Details
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-blue-600 font-medium">Amount</p>
                          <p className="text-blue-900">{formatEther(gift.amount)} MNT</p>
                        </div>
                        <div>
                          <p className="text-blue-600 font-medium">Status</p>
                          <p className="text-blue-900">
                            {gift.redeemed ? 'Redeemed ✅' : 'Available 💎'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-blue-600 font-medium text-xs mb-1">Redeem Link</p>
                        <p className="text-blue-900 text-xs break-all bg-white/50 p-2 rounded">
                          {redeemUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </AnimatedCard>
          )
        })}
      </div>
      
      {gifts.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-4">
          Showing {gifts.length} of {Number(giftCounter)} total gifts
        </div>
      )}
      
      <ConfettiAnimation 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)}
        size={350}
      />
    </div>
  )
}