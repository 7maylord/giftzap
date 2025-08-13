'use client'

import { useGetTopGifters } from '@/hooks/useGiftManager'

export default function TopGifters() {
  const { data, isLoading, error } = useGetTopGifters()

  const topGifters = data ? {
    addresses: data[0] as string[],
    counts: data[1] as bigint[]
  } : null

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading leaderboard...</p>
      </div>
    )
  }

  if (error || !topGifters) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load leaderboard</p>
      </div>
    )
  }

  const validGifters = topGifters.addresses
    .map((address, index) => ({
      address,
      count: Number(topGifters.counts[index])
    }))
    .filter(gifter => gifter.address !== '0x0000000000000000000000000000000000000000' && gifter.count > 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Top Gifters 🏆</h2>
      
      {validGifters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No gifters yet. Be the first to send a gift!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {validGifters.map((gifter, index) => (
            <div key={gifter.address} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index === 0 ? 'bg-yellow-400' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-yellow-600' : 'bg-gray-200'
                }`}>
                  <span className="font-bold text-white">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-900">
                    {gifter.address.slice(0, 6)}...{gifter.address.slice(-4)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {gifter.count} gift{gifter.count !== 1 ? 's' : ''} sent
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">
                  {gifter.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}