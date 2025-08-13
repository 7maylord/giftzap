'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useGiftManagerRead, useGiftManagerWrite } from '@/hooks/useGiftManager'

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
  const { writeContract } = useGiftManagerWrite()

  const { data: giftCounter } = useGiftManagerRead('giftCounter')

  useEffect(() => {
    const fetchGifts = async () => {
      if (!giftCounter || !address) return

      const userGifts: Gift[] = []
      const counter = Number(giftCounter)

      for (let i = 1; i <= counter; i++) {
        try {
          const gift = await fetch('/api/gift/' + i).then(r => r.json()).catch(() => null)
          if (gift && (gift.sender.toLowerCase() === address.toLowerCase() || 
                      gift.recipient.toLowerCase() === address.toLowerCase())) {
            userGifts.push({ ...gift, id: i })
          }
        } catch (error) {
          console.error(`Failed to fetch gift ${i}:`, error)
        }
      }

      setGifts(userGifts.reverse())
      setLoading(false)
    }

    fetchGifts()
  }, [giftCounter, address])

  const handleRedeem = async (giftId: number) => {
    try {
      await writeContract({
        address: '0xcA3f02A32C333e4fc00E3Bd91C648e7deAb5d9eB',
        abi: (await import('@/abi/GiftManager.json')).default,
        functionName: 'redeemGift',
        args: [giftId]
      })
      
      setGifts(prev => prev.map(gift => 
        gift.id === giftId ? { ...gift, redeemed: true } : gift
      ))
    } catch (error) {
      console.error('Redemption failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading gifts...</p>
      </div>
    )
  }

  if (gifts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No gifts found. Start sending or receiving gifts!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Gift History</h2>
      
      <div className="space-y-4">
        {gifts.map((gift) => {
          const isSender = gift.sender.toLowerCase() === address?.toLowerCase()
          const canRedeem = !isSender && !gift.redeemed
          
          return (
            <div key={gift.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isSender ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isSender ? 'Sent' : 'Received'}
                    </span>
                    {gift.isCharity && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        Charity
                      </span>
                    )}
                    {gift.redeemed && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        Redeemed
                      </span>
                    )}
                  </div>
                  
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatEther(gift.amount)} MNT
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    {isSender ? 'To: ' : 'From: '}
                    {(isSender ? gift.recipient : gift.sender).slice(0, 6)}...
                    {(isSender ? gift.recipient : gift.sender).slice(-4)}
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(Number(gift.timestamp) * 1000).toLocaleDateString()}
                  </p>
                </div>
                
                {canRedeem && (
                  <button
                    onClick={() => handleRedeem(gift.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Redeem
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}