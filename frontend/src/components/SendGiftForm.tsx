'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { parseEther, formatEther, keccak256, toHex, isAddress } from 'viem'
import { useGiftManagerWrite } from '@/hooks/useGiftManager'
import { useMockMNTWrite, useTokenBalance, useTokenAllowance } from '@/hooks/useMockMNT'
import { useGetCharities } from '@/hooks/useGiftManager'
import { CONTRACTS } from '@/lib/config'
import { toast } from 'react-toastify'

export default function SendGiftForm() {
  const { address } = useAccount()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [giftType, setGiftType] = useState('')
  const [isCharity, setIsCharity] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { writeContract: writeGiftManager } = useGiftManagerWrite()
  const { writeContract: writeMNT } = useMockMNTWrite()
  
  const { data: balance } = useTokenBalance(address)
  const { data: allowance } = useTokenAllowance(address, CONTRACTS.GIFT_MANAGER)
  const { data: charitiesData } = useGetCharities()

  const charities = charitiesData ? {
    ids: charitiesData[0] as bigint[],
    addresses: charitiesData[1] as string[],
    names: charitiesData[2] as string[],
    descriptions: charitiesData[3] as string[]
  } : null

  const needsApproval = allowance !== undefined && parseEther(amount || '0') > allowance

  const handleApprove = async () => {
    if (!amount) {
      toast.error('Please enter an amount')
      return
    }
    
    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setIsLoading(true)
    try {
      toast.info('Approval transaction submitted. Please confirm in your wallet.')
      
      await writeMNT({
        address: CONTRACTS.MOCK_MNT,
        abi: (await import('@/abi/MockMNT.json')).default,
        functionName: 'approve',
        args: [CONTRACTS.GIFT_MANAGER, parseEther(amount)]
      })
      
      toast.success('Token approval successful!')
    } catch (error: unknown) {
      console.error('Approval failed:', error)
      const err = error as { shortMessage?: string; message?: string }
      const errorMessage = err?.shortMessage || err?.message || 'Approval failed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendGift = async () => {
    // Validation
    if (!recipient) {
      toast.error('Please enter a recipient address')
      return
    }
    
    if (!isCharity && !isAddress(recipient)) {
      toast.error('Please enter a valid recipient address')
      return
    }
    
    if (!amount) {
      toast.error('Please enter an amount')
      return
    }
    
    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    
    if (!giftType) {
      toast.error('Please select a gift type')
      return
    }
    
    if (balance && parseEther(amount) > balance) {
      toast.error('Insufficient balance')
      return
    }

    setIsLoading(true)
    
    try {
      toast.info('Gift transaction submitted. Please confirm in your wallet.')
      
      const giftTypeHash = keccak256(toHex(giftType))
      const messageHash = keccak256(toHex(message))
      
      await writeGiftManager({
        address: CONTRACTS.GIFT_MANAGER,
        abi: (await import('@/abi/GiftManager.json')).default,
        functionName: 'sendGift',
        args: [recipient, parseEther(amount), giftTypeHash, messageHash, isCharity]
      })
      
      toast.success('🎁 Gift sent successfully!')
      
      // Reset form
      setRecipient('')
      setAmount('')
      setMessage('')
      setGiftType('')
      setIsCharity(false)
    } catch (error: unknown) {
      console.error('Gift sending failed:', error)
      const err = error as { shortMessage?: string; message?: string }
      const errorMessage = err?.shortMessage || err?.message || 'Failed to send gift'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMintTokens = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }
    
    setIsLoading(true)
    try {
      toast.info('Minting tokens. Please confirm in your wallet.')
      
      await writeMNT({
        address: CONTRACTS.MOCK_MNT,
        abi: (await import('@/abi/MockMNT.json')).default,
        functionName: 'mint',
        args: [address, parseEther('1000')]
      })
      
      toast.success('Successfully minted 1000 MNT tokens!')
    } catch (error: unknown) {
      console.error('Minting failed:', error)
      const err = error as { shortMessage?: string; message?: string }
      const errorMessage = err?.shortMessage || err?.message || 'Minting failed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-3 rounded-2xl border border-primary/20 mb-4">
          <span className="text-2xl">🎁</span>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Send a Gift</h2>
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-gray-600 max-w-md mx-auto">Spread joy and create memories on the blockchain</p>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200/50 card-hover">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Your Balance</p>
            <p className="text-2xl font-bold text-blue-900">
              {balance ? formatEther(balance) : '0'} MNT
            </p>
          </div>
          <button
            onClick={handleMintTokens}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <span>💰</span>
            )}
            Mint 1000 MNT
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-soft">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={isCharity}
              onChange={(e) => setIsCharity(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
              isCharity
                ? 'bg-accent border-accent text-white'
                : 'border-gray-300 group-hover:border-accent'
            }`}>
              {isCharity && <span className="text-xs">✓</span>}
            </div>
            <span className="font-medium text-gray-700 group-hover:text-accent transition-colors">
              ❤️ Send to Charity
            </span>
          </label>
        </div>

        {isCharity && charities ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Charity
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 bg-white hover:border-primary/50 cursor-pointer"
            >
              <option value="">Select a charity</option>
              {charities.addresses.map((address, index) => (
                <option key={index} value={address}>
                  {Buffer.from(charities.names[index].slice(2), 'hex').toString()} ({address.slice(0, 6)}...{address.slice(-4)})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 bg-white hover:border-primary/50"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (MNT)
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 bg-white hover:border-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gift Type
          </label>
          <select
            value={giftType}
            onChange={(e) => setGiftType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 bg-white hover:border-primary/50 cursor-pointer"
          >
            <option value="">Select gift type</option>
            <optgroup label="🎉 Celebrations">
              <option value="birthday">🎂 Birthday</option>
              <option value="anniversary">💍 Anniversary</option>
              <option value="graduation">🎓 Graduation</option>
              <option value="wedding">👰 Wedding</option>
              <option value="baby_shower">🍼 Baby Shower</option>
              <option value="new_year">🎊 New Year</option>
              <option value="valentine">💝 Valentine&apos;s Day</option>
              <option value="christmas">🎄 Christmas</option>
            </optgroup>
            <optgroup label="🏆 Achievements">
              <option value="congratulations">🎉 Congratulations</option>
              <option value="promotion">📈 Promotion</option>
              <option value="new_job">💼 New Job</option>
              <option value="success">🌟 Success</option>
              <option value="achievement">🏅 Achievement</option>
            </optgroup>
            <optgroup label="❤️ Appreciation">
              <option value="thank_you">🙏 Thank You</option>
              <option value="appreciation">💖 Appreciation</option>
              <option value="friendship">👫 Friendship</option>
              <option value="love">💕 Love</option>
              <option value="support">🤝 Support</option>
            </optgroup>
            <optgroup label="🌟 Other">
              <option value="just_because">✨ Just Because</option>
              <option value="good_luck">🍀 Good Luck</option>
              <option value="get_well">💊 Get Well Soon</option>
              <option value="apology">😔 Apology</option>
              <option value="encouragement">💪 Encouragement</option>
              <option value="sympathy">🤗 Sympathy</option>
              <option value="welcome">🏠 Welcome</option>
              <option value="farewell">👋 Farewell</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 bg-white hover:border-primary/50 resize-none"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          {needsApproval && (
            <button
              onClick={handleApprove}
              disabled={isLoading || !amount}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Approving...
                </>
              ) : (
                <>
                  <span>🔓</span>
                  Approve {amount} MNT
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleSendGift}
            disabled={isLoading || !recipient || !amount || !giftType || needsApproval}
            className="flex-1 button-gradient text-primary-foreground font-bold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg animate-pulse-glow"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Sending...
              </>
            ) : (
              <>
                <span>🎁</span>
                Send Gift
                <span>✨</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}