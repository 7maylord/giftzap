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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Send a Gift</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          Balance: {balance ? formatEther(balance) : '0'} MNT
        </p>
        <button
          onClick={handleMintTokens}
          disabled={isLoading}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Mint 1000 MNT (Testnet)
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isCharity}
              onChange={(e) => setIsCharity(e.target.checked)}
              className="mr-2"
            />
            Send to Charity
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gift Type
          </label>
          <select
            value={giftType}
            onChange={(e) => setGiftType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex space-x-4">
          {needsApproval && (
            <button
              onClick={handleApprove}
              disabled={isLoading || !amount}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg"
            >
              {isLoading ? 'Approving...' : `Approve ${amount} MNT`}
            </button>
          )}
          
          <button
            onClick={handleSendGift}
            disabled={isLoading || !recipient || !amount || !giftType || needsApproval}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-primary-foreground font-bold py-3 px-6 rounded-lg"
          >
            {isLoading ? 'Sending...' : 'Send Gift 🎁'}
          </button>
        </div>
      </div>
    </div>
  )
}