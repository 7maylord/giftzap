'use client'

import { useGetTopGifters } from '@/hooks/useGiftManager'

export default function TopGifters() {
  const { data, isLoading, error } = useGetTopGifters()

  const topGifters = data ? {
    addresses: (data as [string[], bigint[]])[0],
    counts: (data as [string[], bigint[]])[1]
  } : null

  if (isLoading) {
    return (
      <div className="text-center py-8 animate-fadeInUp">
        <div className="loading-spinner mx-auto mb-4 w-8 h-8"></div>
        <p className="text-gray-600 animate-pulse">Loading leaderboard...</p>
      </div>
    )
  }

  if (error || !topGifters) {
    return (
      <div className="text-center py-8 animate-fadeInUp">
        <div className="text-4xl mb-4">😔</div>
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
    <div className="space-y-6 animate-fadeInUp">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-3 rounded-2xl border border-yellow-200/50 mb-4">
          <span className="text-2xl">🏆</span>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Top Gifters</h2>
          <span className="text-2xl">👑</span>
        </div>
        <p className="text-gray-600 max-w-md mx-auto">Celebrating the most generous members of our community</p>
      </div>
      
      {validGifters.length === 0 ? (
        <div className="text-center py-12 animate-scaleIn">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-gray-600 text-lg">No gifters yet. Be the first to send a gift!</p>
          <div className="mt-4 text-sm text-gray-500">Start spreading joy and climb to the top!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {validGifters.map((gifter, index) => (
            <div 
              key={gifter.address} 
              className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-soft border border-gray-100 card-hover animate-slideInRight"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center space-x-6">
                <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-medium ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 animate-pulse-glow' : 
                  index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 
                  index === 2 ? 'bg-gradient-to-br from-yellow-600 to-yellow-800' : 'bg-gradient-to-br from-gray-200 to-gray-400'
                }`}>
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                  </span>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-gray-700">#{index + 1}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="font-bold text-gray-900 text-lg mb-1">
                    {gifter.address.slice(0, 8)}...{gifter.address.slice(-6)}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    {gifter.count} gift{gifter.count !== 1 ? 's' : ''} sent
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    {gifter.count}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {validGifters.length > 0 && (
        <div className="text-center mt-8 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-2 rounded-full border border-primary/20">
            <span>✨</span>
            <span className="text-sm font-medium text-gray-700">Keep giving to climb the leaderboard!</span>
            <span>🚀</span>
          </div>
        </div>
      )}
    </div>
  )
}