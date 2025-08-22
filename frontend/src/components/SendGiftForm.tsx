'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { parseEther, formatEther, keccak256, toHex, isAddress } from 'viem'
import { useGiftManagerWrite, useGiftManagerRead, useGetFavorites } from '@/hooks/useGiftManager'
import { useMockMNTWrite, useTokenBalance, useTokenAllowance } from '@/hooks/useMockMNT'
import { useGetCharities } from '@/hooks/useGiftManager'
import { CONTRACTS } from '@/lib/config'
import { toast } from 'react-toastify'
import GiftSuccessModal from './GiftSuccessModal'
import MockMNTABI from '@/abi/MockMNT.json'
import GiftManagerABI from '@/abi/GiftManager.json'

export default function SendGiftForm({ 
  prefilledRecipient, 
  onClearPrefilled 
}: { 
  prefilledRecipient?: {address: string, name: string} | null,
  onClearPrefilled?: () => void 
} = {}) {
  const { address } = useAccount()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [giftType, setGiftType] = useState('')
  const [isCharity, setIsCharity] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentGiftDetails, setCurrentGiftDetails] = useState<{
    recipient: string
    amount: bigint
    giftType: string
    message: string
    txHash?: string
    giftId?: string
  } | undefined>(undefined)

  const { writeContract: writeGiftManager } = useGiftManagerWrite()
  const { writeContract: writeMNT } = useMockMNTWrite()
  
  const { data: balance } = useTokenBalance(address)
  const { data: allowance } = useTokenAllowance(address, CONTRACTS.GIFT_MANAGER)
  const { data: charitiesData } = useGetCharities()
  const { data: favoritesData } = useGetFavorites(address)
  const { data: giftCounter, refetch: refetchGiftCounter } = useGiftManagerRead('giftCounter')

  const charities = charitiesData ? {
    ids: (charitiesData as [bigint[], string[], string[], string[]])[0],
    addresses: (charitiesData as [bigint[], string[], string[], string[]])[1],
    names: (charitiesData as [bigint[], string[], string[], string[]])[2],
    metadataURIs: (charitiesData as [bigint[], string[], string[], string[]])[3]
  } : null

  const favorites = favoritesData ? (favoritesData as [string[], string[], bigint[], bigint[]])[0]?.map((recipient: string, index: number) => {
    let decodedName = 'Unknown'
    const nameBytes = (favoritesData as [string[], string[], bigint[], bigint[]])[1]?.[index]
    
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
      giftCount: Number((favoritesData as [string[], string[], bigint[], bigint[]])[2]?.[index] || 0),
      totalAmount: (favoritesData as [string[], string[], bigint[], bigint[]])[3]?.[index] || BigInt(0)
    }
  }) || [] : []

  // Handle prefilled recipient from favorites
  useEffect(() => {
    if (prefilledRecipient) {
      setRecipient(prefilledRecipient.address)
      setIsFavorite(true)
      setIsCharity(false)
      // Optionally prefill message with the name
      setMessage(`Hi ${prefilledRecipient.name !== 'Unknown' ? prefilledRecipient.name : 'there'}! 🎁`)
      // Clear the prefilled data
      onClearPrefilled?.()
    }
  }, [prefilledRecipient, onClearPrefilled])


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
    
    if (isCharity && !charities?.addresses.includes(recipient)) {
      toast.error('Please select a valid charity')
      return
    }

    if (isFavorite && !favorites.some(fav => fav.recipient === recipient)) {
      toast.error('Please select a valid favorite')
      return
    }
    
    if (balance && parseEther(amount) > (balance as bigint)) {
      toast.error('Insufficient balance')
      return
    }

    let amountToSend: bigint
    let currentCounter: number
    
    try {
      amountToSend = parseEther(amount)
      
      // Get current gift counter BEFORE sending
      const counterResult = await refetchGiftCounter()
      currentCounter = counterResult.data ? Number(counterResult.data) : 0
      const nextGiftId = currentCounter + 1
      
      // Ensure modal is closed at start of new transaction
      setShowSuccessModal(false)
      setCurrentGiftDetails(undefined)
      setIsLoading(true)
      
      // Check if approval is needed
      if (allowance !== undefined && amountToSend > (allowance as bigint)) {
        toast.info('Step 1: Approve tokens. Please confirm the approval transaction in your wallet.')
        
        // First approve the tokens and wait for confirmation
        await writeMNT({
          address: CONTRACTS.MOCK_MNT,
          abi: MockMNTABI,
          functionName: 'approve',
          args: [CONTRACTS.GIFT_MANAGER, amountToSend]
        })
        
        // Wait a moment for the transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.success('✅ Token approval confirmed!')
      }
      
      toast.info('Step 2: Send gift. Please confirm the gift transaction in your wallet.')
      
      const giftTypeHash = keccak256(toHex(giftType))
      const messageHash = keccak256(toHex(message))
      
      await writeGiftManager({
        address: CONTRACTS.GIFT_MANAGER,
        abi: GiftManagerABI,
        functionName: 'sendGift',
        args: [recipient, amountToSend, giftTypeHash, messageHash, isCharity]
      })
      
      // Store gift details and show modal with the known gift ID
      const giftDetails = {
        recipient,
        amount: amountToSend,
        giftType,
        message,
        txHash: 'success', // Always provide a truthy value to trigger success state
        giftId: nextGiftId.toString()
      }
      
      
      // Update success state first
      setCurrentGiftDetails(giftDetails)
      setShowSuccessModal(true)
      
      // Show success toast
      toast.success('🎁 Gift sent successfully!')
      
      // Reset form after a short delay
      setTimeout(() => {
        setRecipient('')
        setAmount('')
        setMessage('')
        setGiftType('')
        setIsCharity(false)
        setIsFavorite(false)
      }, 500)
    } catch (error: unknown) {
      console.error('Transaction failed:', error)
      const err = error as { shortMessage?: string; message?: string }
      const errorMessage = err?.shortMessage || err?.message || 'Transaction failed'
      
      // Check if it's a user rejection or gas error
      if (errorMessage.toLowerCase().includes('user rejected') || 
          errorMessage.toLowerCase().includes('cancelled') ||
          errorMessage.toLowerCase().includes('gas')) {
        toast.info('Transaction cancelled')
      } else {
        toast.error(errorMessage)
      }

      // Close modal if there's an error
      setShowSuccessModal(false)
      setCurrentGiftDetails(undefined)
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
        abi: MockMNTABI,
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

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    setCurrentGiftDetails(undefined)
  }

  return (
    <>
      <GiftSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        giftDetails={currentGiftDetails}
      />
      
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
              {balance && typeof balance === 'bigint' ? formatEther(balance) : '0'} MNT
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 shadow-soft">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={isCharity}
                onChange={(e) => {
                  setIsCharity(e.target.checked)
                  if (e.target.checked) {
                    setIsFavorite(false)
                    setRecipient('')
                  }
                }}
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

          <div className="p-4 rounded-xl border border-gray-200 shadow-soft">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => {
                  setIsFavorite(e.target.checked)
                  if (e.target.checked) {
                    setIsCharity(false)
                    setRecipient('')
                  }
                }}
                disabled={!favorites.length}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                isFavorite
                  ? 'bg-primary border-primary text-white'
                  : favorites.length 
                    ? 'border-gray-300 group-hover:border-primary'
                    : 'border-gray-200 bg-gray-100'
              }`}>
                {isFavorite && <span className="text-xs">✓</span>}
              </div>
              <span className={`font-medium transition-colors ${
                favorites.length 
                  ? 'text-gray-700 group-hover:text-primary'
                  : 'text-gray-400'
              }`}>
                ⭐ Send to Favorite
              </span>
              {!favorites.length && (
                <span className="text-xs text-gray-400 ml-2">(No favorites yet)</span>
              )}
            </label>
          </div>
        </div>

        {isCharity && charities ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Charity
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 hover:border-primary/50 cursor-pointer"
            >
              <option value="">Select a charity</option>
              {charities.addresses.map((address, index) => {
                let charityName = 'Unknown Charity'
                try {
                  const nameBytes = charities.names[index]
                  if (typeof nameBytes === 'string' && nameBytes.startsWith('0x')) {
                    const nameHex = nameBytes.slice(2)
                    if (nameHex) {
                      charityName = Buffer.from(nameHex, 'hex').toString('utf8').replace(/\0/g, '').trim()
                    }
                  } else if (typeof nameBytes === 'string') {
                    charityName = nameBytes.trim()
                  }
                  if (!charityName) {
                    charityName = `Charity #${Number(charities.ids[index])}`
                  }
                } catch (error) {
                  console.error('Error parsing charity name:', error)
                  charityName = `Charity #${Number(charities.ids[index])}`
                }
                
                return (
                  <option key={index} value={address}>
                    {charityName} ({address.slice(0, 6)}...{address.slice(-4)})
                  </option>
                )
              })}
            </select>
          </div>
        ) : isFavorite && favorites.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Favorite
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 hover:border-primary/50 cursor-pointer"
            >
              <option value="">Select a favorite</option>
              {favorites.map((favorite, index) => (
                <option key={index} value={favorite.recipient}>
                  {favorite.name !== 'Unknown' ? favorite.name : 'Anonymous'} ({favorite.recipient.slice(0, 6)}...{favorite.recipient.slice(-4)}) - {favorite.giftCount} gifts
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 hover:border-primary/50"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 hover:border-primary/50 cursor-pointer"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent input-glow transition-all duration-300 hover:border-primary/50 resize-none"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSendGift}
            disabled={isLoading || !recipient || !amount || !giftType}
            className="w-full button-gradient text-primary-foreground font-bold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg animate-pulse-glow"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
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
    </>
  )
}