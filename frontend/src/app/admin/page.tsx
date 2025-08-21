'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { CONTRACTS } from '@/lib/config'
import { uploadCharityMetadata, fetchFromIPFS } from '@/utils/ipfs'
import GiftManagerABI from '@/abi/GiftManager.json'

interface Charity {
  id: number
  address: string
  name: string
  metadataURI: string
  active: boolean
}

interface CharityMetadata {
  name: string
  description: string
  logo?: string
  website?: string
}


export default function AdminPage() {
  const { address } = useAccount()
  const [charities, setCharities] = useState<Charity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [newCharity, setNewCharity] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    walletAddress: ''
  })

  const { writeContract: addCharity, isPending: isAddingCharity } = useWriteContract()
  const { writeContract: removeCharity, isPending: isRemovingCharity } = useWriteContract()

  // Check if user is owner
  const { data: contractOwner } = useReadContract({
    address: CONTRACTS.GIFT_MANAGER,
    abi: GiftManagerABI,
    functionName: 'owner'
  })

  // Get all charities (same as CharityList component)
  const { data: charitiesData, refetch: refetchCharities } = useReadContract({
    address: CONTRACTS.GIFT_MANAGER,
    abi: GiftManagerABI,
    functionName: 'getCharities'
  })

  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase()

  // Parse charity data from getCharities call (same as CharityList)
  useEffect(() => {
    if (charitiesData && Array.isArray(charitiesData)) {
      const parsedCharities = {
        ids: charitiesData[0] as bigint[],
        addresses: charitiesData[1] as string[],
        names: charitiesData[2] as string[],
        metadataURIs: charitiesData[3] as string[]
      }

      console.log('Admin - Raw charity data:', parsedCharities)

      const formattedCharities: Charity[] = parsedCharities.addresses.map((address, index) => ({
        id: Number(parsedCharities.ids[index]),
        address: address,
        name: parsedCharities.names[index] || `Charity #${Number(parsedCharities.ids[index])}`,
        metadataURI: parsedCharities.metadataURIs[index] || '',
        active: true
      }))

      console.log('Admin - Formatted charities:', formattedCharities)
      setCharities(formattedCharities)
      setIsLoading(false)
    } else if (charitiesData === null || charitiesData === undefined) {
      // Still loading
      setIsLoading(true)
    } else {
      // Empty or invalid data
      setCharities([])
      setIsLoading(false)
    }
  }, [charitiesData])

  const handleAddCharity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) {
      setError('Only the contract owner can add charities')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Upload metadata to IPFS
      const metadata: CharityMetadata = {
        name: newCharity.name,
        description: newCharity.description,
        logo: newCharity.logo || undefined,
        website: newCharity.website || undefined
      }

      const ipfsHash = await uploadCharityMetadata(metadata)

      // Add charity to smart contract
      addCharity({
        address: CONTRACTS.GIFT_MANAGER,
        abi: GiftManagerABI,
        functionName: 'addCharity',
        args: [newCharity.walletAddress as `0x${string}`, newCharity.name, ipfsHash]
      }, {
        onSuccess: () => {
          setSuccess(`Charity "${newCharity.name}" added successfully!`)
          setNewCharity({
            name: '',
            description: '',
            logo: '',
            website: '',
            walletAddress: ''
          })
          refetchCharities()
        },
        onError: (error) => {
          setError(`Failed to add charity: ${error.message}`)
        }
      })

    } catch (err) {
      setError(`Failed to upload metadata: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCharity = (charityId: number) => {
    if (!isOwner) {
      setError('Only the contract owner can remove charities')
      return
    }

    removeCharity({
      address: CONTRACTS.GIFT_MANAGER,
      abi: GiftManagerABI,
      functionName: 'removeCharity',
      args: [BigInt(charityId)]
    }, {
      onSuccess: () => {
        setSuccess('Charity removed successfully!')
        refetchCharities()
      },
      onError: (error) => {
        setError(`Failed to remove charity: ${error.message}`)
      }
    })
  }

  // Function to copy address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('Address copied to clipboard!')
      setTimeout(() => setSuccess(null), 2000) // Clear success message after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error)
      setError('Failed to copy address')
    }
  }

  if (!address) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Please connect your wallet to access the admin panel</p>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Only the contract owner can access this admin panel</p>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p>Your address: {address}</p>
            <p>Contract owner: {contractOwner || 'Loading...'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage charities and platform settings</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Add New Charity Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl text-black font-semibold mb-4">➕ Add New Charity</h2>
        <p className="text-black mb-6">Create a new charity that users can donate to. Metadata will be uploaded to IPFS.</p>
        
        <form onSubmit={handleAddCharity} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                Charity Name *
              </label>
              <input
                id="name"
                type="text"
                value={newCharity.name}
                onChange={(e) => setNewCharity({...newCharity, name: e.target.value})}
                placeholder="e.g. Mantle Aid Foundation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address *
              </label>
              <input
                id="walletAddress"
                type="text"
                value={newCharity.walletAddress}
                onChange={(e) => setNewCharity({...newCharity, walletAddress: e.target.value})}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={newCharity.description}
              onChange={(e) => setNewCharity({...newCharity, description: e.target.value})}
              placeholder="Describe what this charity does..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                id="website"
                type="url"
                value={newCharity.website}
                onChange={(e) => setNewCharity({...newCharity, website: e.target.value})}
                placeholder="https://charity.org"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                id="logo"
                type="url"
                value={newCharity.logo}
                onChange={(e) => setNewCharity({...newCharity, logo: e.target.value})}
                placeholder="https://charity.org/logo.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isAddingCharity}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isLoading || isAddingCharity) ? '⏳ Adding...' : 'Add Charity'}
          </button>
        </form>
      </div>

      {/* Existing Charities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl text-black font-semibold mb-4">Active Charities</h2>
        <p className="text-gray-600 mb-6">Manage existing charities on the platform</p>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p>⏳ Loading charities...</p>
          </div>
        ) : charities.length === 0 ? (
          <p className="text-gray-600 py-8 text-center">No charities found</p>
        ) : (
          <div className="space-y-4">
            {charities.map((charity) => (
              <div key={charity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-black mb-1">{charity.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-600 font-mono">
                      {charity.address === 'Loading...' ? charity.address : 
                       `${charity.address.slice(0, 6)}...${charity.address.slice(-4)}`}
                    </p>
                    {charity.address !== 'Loading...' && charity.address !== 'Error' && (
                      <button
                        onClick={() => copyToClipboard(charity.address)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title="Copy full address"
                      >
                        <svg 
                          fill="#6b7280" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="w-4 h-4 hover:fill-gray-700"
                        >
                          <path d="M16,22H6a2,2,0,0,1-2-2V6A1,1,0,0,1,6,6V20H16a1,1,0,0,1,0,2Z" style={{fill: '#2ca9bc'}} />
                          <path d="M19.71,5.29l-3-3A1.05,1.05,0,0,0,16,2H9A1,1,0,0,0,8,3V17a1,1,0,0,0,1,1H19a1,1,0,0,0,1-1V6A1,1,0,0,0,19.71,5.29Z" style={{fill: '#374151'}} />
                        </svg>
                      </button>
                    )}
                  </div>
                  {charity.metadataURI && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${charity.metadataURI}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      🔗 View Metadata
                    </a>
                  )}
                  <p className="text-xs text-gray-500 mt-1">ID: {charity.id}</p>
                </div>
                <button
                  onClick={() => handleRemoveCharity(charity.id)}
                  disabled={isRemovingCharity}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isRemovingCharity ? '⏳' : '🗑️ Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}