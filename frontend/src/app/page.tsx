'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import SendGiftForm from '@/components/SendGiftForm'
import GiftHistory from '@/components/GiftHistory'
import TopGifters from '@/components/TopGifters'
import CharityList from '@/components/CharityList'
import NetworkIndicator from '@/components/NetworkIndicator'
import { useNetworkSwitch } from '@/hooks/useNetworkSwitch'

export default function Home() {
  const { login, logout, authenticated } = usePrivy()
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState('send')
  const { isCorrectNetwork } = useNetworkSwitch()

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
        <div className="text-center animate-fadeInUp relative z-10 max-w-lg mx-auto px-6">
          <div className="mb-8">
            <div className="text-6xl mb-4 animate-pulse-glow inline-block">🎁</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent mb-4">
              GiftZap
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Send gifts and earn badges on Mantle Network with style and security
            </p>
          </div>
          <button
            onClick={login}
            className="button-gradient text-primary-foreground font-bold py-4 px-8 rounded-xl text-lg hover-lift inline-flex items-center gap-3 shadow-lg"
          >
            <span>✨</span>
            Connect Wallet
            <span>🚀</span>
          </button>
          <div className="mt-8 text-sm text-gray-500 animate-slideInRight">
            Powered by secure blockchain technology
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse-glow">🎁</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GiftZap
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NetworkIndicator />
            <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <span className="text-sm font-medium text-primary">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            <button
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover-lift transition-all duration-300"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Network Warning Banner */}
      {!isCorrectNetwork && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Wrong Network:</strong> Please switch to Mantle Sepolia Testnet to use GiftZap properly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 animate-fadeInUp">
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-soft">
            <nav className="flex space-x-1 p-2">
              {[
                { id: 'send', label: '🎁 Send Gift', emoji: '🎁' },
                { id: 'history', label: '📜 My Gifts', emoji: '📜' },
                { id: 'leaderboard', label: '🏆 Leaderboard', emoji: '🏆' },
                { id: 'charities', label: '❤️ Charities', emoji: '❤️' }
              ].map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white text-primary shadow-medium border border-primary/20 scale-105'
                      : 'text-gray-600 hover:text-primary hover:bg-white/50 hover:scale-102'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="mr-2">{tab.emoji}</span>
                  {tab.label.split(' ')[1]}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-large border border-white/40 p-8 card-hover">
          <div className="animate-scaleIn">
            {activeTab === 'send' && <SendGiftForm />}
            {activeTab === 'history' && <GiftHistory />}
            {activeTab === 'leaderboard' && <TopGifters />}
            {activeTab === 'charities' && <CharityList />}
          </div>
        </div>
      </main>
    </div>
  )
}
