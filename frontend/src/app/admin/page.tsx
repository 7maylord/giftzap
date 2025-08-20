'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { CONTRACTS } from '@/lib/config'
import { uploadCharityMetadata } from '@/utils/ipfs'

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

const GIFT_MANAGER_ABI = [
  {
    "inputs": [{"name": "charityAddress", "type": "address"}, {"name": "name", "type": "string"}, {"name": "metadataURI", "type": "string"}],
    "name": "addCharity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "charityId", "type": "uint256"}],
    "name": "removeCharity", 
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllActiveCharities",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "charityId", "type": "uint256"}],
    "name": "getCharity",
    "outputs": [
      {"name": "charityAddress", "type": "address"},
      {"name": "name", "type": "string"}, 
      {"name": "metadataURI", "type": "string"},
      {"name": "active", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

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
    abi: GIFT_MANAGER_ABI,
    functionName: 'owner'
  })

  // Get all active charities
  const { data: activeCharityIds, refetch: refetchCharities } = useReadContract({
    address: CONTRACTS.GIFT_MANAGER,
    abi: GIFT_MANAGER_ABI,
    functionName: 'getAllActiveCharities'
  })

  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase()

  // Fetch charity details
  useEffect(() => {
    const fetchCharityDetails = async () => {
      if (!activeCharityIds || activeCharityIds.length === 0) {
        setCharities([])
        return
      }

      setIsLoading(true)
      try {
        const charityPromises = activeCharityIds.map(async (id: bigint) => {
          return {
            id: Number(id),
            address: '0x...',
            name: 'Loading...',
            metadataURI: '',
            active: true
          }
        })

        const charitiesData = await Promise.all(charityPromises)
        setCharities(charitiesData)
      } catch (err) {
        setError('Failed to fetch charity details')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCharityDetails()
  }, [activeCharityIds])

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
        abi: GIFT_MANAGER_ABI,
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
      abi: GIFT_MANAGER_ABI,
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
        <h2 className="text-xl font-semibold mb-4">➕ Add New Charity</h2>
        <p className="text-gray-600 mb-6">Create a new charity that users can donate to. Metadata will be uploaded to IPFS.</p>
        
        <form onSubmit={handleAddCharity} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
        <h2 className="text-xl font-semibold mb-4">Active Charities</h2>
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
                <div>
                  <h3 className="font-medium">{charity.name}</h3>
                  <p className="text-sm text-gray-600">{charity.address}</p>
                  {charity.metadataURI && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${charity.metadataURI}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Metadata 🔗
                    </a>
                  )}
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