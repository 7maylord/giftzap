'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import SendGiftForm from '@/components/SendGiftForm'
import GiftHistory from '@/components/GiftHistory'
import TopGifters from '@/components/TopGifters'
import CharityList from '@/components/CharityList'

export default function Home() {
  const { login, logout, authenticated } = usePrivy()
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState('send')

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎁 GiftZap</h1>
          <p className="text-xl text-gray-600 mb-8">Send gifts and earn badges on Mantle Network</p>
          <button
            onClick={login}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">🎁 GiftZap</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <button
              onClick={logout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'send', label: 'Send Gift' },
                { id: 'history', label: 'My Gifts' },
                { id: 'leaderboard', label: 'Leaderboard' },
                { id: 'charities', label: 'Charities' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'send' && <SendGiftForm />}
          {activeTab === 'history' && <GiftHistory />}
          {activeTab === 'leaderboard' && <TopGifters />}
          {activeTab === 'charities' && <CharityList />}
        </div>
      </main>
    </div>
  )
}
