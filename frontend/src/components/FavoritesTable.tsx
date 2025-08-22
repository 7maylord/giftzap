'use client'

import { useAccount } from 'wagmi'
import { useGetFavorites } from '@/hooks/useGiftManager'
import { formatEther } from 'viem'
import { useState } from 'react'
import { toast } from 'react-toastify'
import AddFavoriteModal from './AddFavoriteModal'

export default function FavoritesTable({ 
  onSendGift 
}: { 
  onSendGift?: (recipient: string, name: string) => void 
}) {
  const { address } = useAccount()
  const { data: favoritesData, isLoading, error, refetch } = useGetFavorites(address)
  const [sortBy, setSortBy] = useState<'name' | 'giftCount' | 'totalAmount'>('giftCount')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showAddFavoriteModal, setShowAddFavoriteModal] = useState(false)

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
  
  const favorites = typedFavoritesData?.[0]?.map((recipient: string, index: number) => {
    let decodedName = 'Unknown'
    const nameBytes = typedFavoritesData?.[1]?.[index]
    
    // Decode bytes32 name to string
    if (nameBytes && typeof nameBytes === 'string') {
      try {
        if (nameBytes.startsWith('0x')) {
          const nameHex = nameBytes.slice(2)
          if (nameHex && nameHex !== '0'.repeat(64)) {
            const bytes = new Uint8Array(nameHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
            decodedName = new TextDecoder().decode(bytes).replace(/\0/g, '').trim()
          }
        }
      } catch (error) {
        console.error('Error decoding favorite name:', error)
      }
    }
    
    return {
      recipient,
      name: decodedName || 'Unknown',
      giftCount: Number(typedFavoritesData?.[2]?.[index] || 0),
      totalAmount: typedFavoritesData?.[3]?.[index] || BigInt(0)
    }
  }) || []

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Your Favorites</h2>
          <button
            onClick={() => setShowAddFavoriteModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 hover-lift"
          >
            <span>⭐</span>
            Add Favorite
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💝</div>
          <h3 className="text-lg font-semibold text-black mb-2">No favorites yet</h3>
          <p className="text-black mb-4">
            Start sending gifts to see your favorite recipients here, or add someone manually!
          </p>
          <button
            onClick={() => setShowAddFavoriteModal(true)}
            className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Favorite
          </button>
        </div>

        <AddFavoriteModal
          isOpen={showAddFavoriteModal}
          onClose={() => setShowAddFavoriteModal(false)}
          onSuccess={() => {
            // Refetch favorites data to update the list
            refetch()
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-secondary">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">Your Favorites</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-black">
            {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setShowAddFavoriteModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 hover-lift"
          >
            <span>⭐</span>
            Add Favorite
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary">
              <th 
                className="text-left py-3 px-4 font-semibold text-black cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Recipient</span>
                  <SortIcon column="name" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-black cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => handleSort('giftCount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Gifts Sent</span>
                  <SortIcon column="giftCount" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-semibold text-black cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total Amount</span>
                  <SortIcon column="totalAmount" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-black">
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
                    <div className="font-medium text-black">
                      {favorite.name !== 'Unknown' ? favorite.name : 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600 font-mono">
                      {favorite.recipient.slice(0, 8)}...{favorite.recipient.slice(-6)}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-black">{favorite.giftCount}</span>
                    <span className="text-2xl">🎁</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-black">
                    {formatEther(favorite.totalAmount)} MNT
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {onSendGift && (
                      <button
                        onClick={() => onSendGift(favorite.recipient, favorite.name)}
                        className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                      >
                        Send Gift
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(favorite.recipient)
                        toast.success('Address copied to clipboard!')
                      }}
                      className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                    >
                      Copy Address
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddFavoriteModal
        isOpen={showAddFavoriteModal}
        onClose={() => setShowAddFavoriteModal(false)}
        onSuccess={() => {
          // Refetch favorites data to update the list
          refetch()
        }}
      />
    </div>
  )
}