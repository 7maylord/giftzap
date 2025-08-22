'use client'

import { useAccount } from 'wagmi'
import { useGetFavorites } from '@/hooks/useGiftManager'
import { formatEther } from 'viem'
import { useState } from 'react'

export default function FavoritesTable() {
  const { address } = useAccount()
  const { data: favoritesData, isLoading, error } = useGetFavorites(address)
  const [sortBy, setSortBy] = useState<'name' | 'giftCount' | 'totalAmount'>('giftCount')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  if (!address) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
        <h2 className="text-2xl font-bold text-foreground mb-4">Your Favorites</h2>
        <p className="text-secondary-foreground">Connect your wallet to view your favorite recipients</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
        <h2 className="text-2xl font-bold text-foreground mb-4">Your Favorites</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-secondary rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !favoritesData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
        <h2 className="text-2xl font-bold text-foreground mb-4">Your Favorites</h2>
        <p className="text-red-500">Failed to load favorites</p>
      </div>
    )
  }

  // Parse favorites data
  type FavoritesDataType = [string[], string[], bigint[], bigint[]] | undefined
  const typedFavoritesData = favoritesData as FavoritesDataType
  
  const favorites = typedFavoritesData?.[0]?.map((recipient: string, index: number) => ({
    recipient,
    name: typedFavoritesData?.[1]?.[index] || 'Unknown',
    giftCount: Number(typedFavoritesData?.[2]?.[index] || 0),
    totalAmount: typedFavoritesData?.[3]?.[index] || BigInt(0)
  })) || []

  // Sort favorites
  const sortedFavorites = [...favorites].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'giftCount':
        comparison = a.giftCount - b.giftCount
        break
      case 'totalAmount':
        comparison = Number(a.totalAmount - b.totalAmount)
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (column: 'name' | 'giftCount' | 'totalAmount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ column }: { column: 'name' | 'giftCount' | 'totalAmount' }) => {
    if (sortBy !== column) return <span className="text-gray-300">↕</span>
    return sortOrder === 'asc' ? <span className="text-primary">↑</span> : <span className="text-primary">↓</span>
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
        <h2 className="text-2xl font-bold text-foreground mb-4">Your Favorites</h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💝</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
          <p className="text-secondary-foreground">
            Start sending gifts to see your favorite recipients here!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Your Favorites</h2>
        <div className="text-sm text-secondary-foreground">
          {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary">
              <th 
                className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Recipient</span>
                  <SortIcon column="name" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => handleSort('giftCount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Gifts Sent</span>
                  <SortIcon column="giftCount" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total Amount</span>
                  <SortIcon column="totalAmount" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFavorites.map((favorite, index) => (
              <tr 
                key={favorite.recipient} 
                className={`border-b border-secondary/30 hover:bg-secondary/10 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-secondary/5'
                }`}
              >
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-foreground">
                      {favorite.name !== 'Unknown' ? favorite.name : 'Anonymous'}
                    </div>
                    <div className="text-sm text-secondary-foreground font-mono">
                      {favorite.recipient.slice(0, 8)}...{favorite.recipient.slice(-6)}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-foreground">{favorite.giftCount}</span>
                    <span className="text-2xl">🎁</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-foreground">
                    {formatEther(favorite.totalAmount)} MNT
                  </div>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(favorite.recipient)
                    }}
                    className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                  >
                    Copy Address
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}