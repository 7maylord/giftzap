'use client'

import { useState, useEffect } from 'react'
import { useGetCharities } from '@/hooks/useGiftManager'
import { fetchFromIPFS } from '@/utils/ipfs'
import { toast } from 'react-toastify'

interface CharityMetadata {
  name: string
  description: string
  logo?: string
  website?: string
}

export default function CharityList() {
  const { data, isLoading, error } = useGetCharities()
  const [charityMetadata, setCharityMetadata] = useState<Record<string, CharityMetadata>>({})
  const [loadingMetadata, setLoadingMetadata] = useState<Record<string, boolean>>({})
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())

  // Function to fetch metadata from IPFS
  const fetchCharityMetadata = async (metadataURI: string) => {
    if (!metadataURI || loadingMetadata[metadataURI] || charityMetadata[metadataURI]) {
      return
    }

    setLoadingMetadata(prev => ({ ...prev, [metadataURI]: true }))
    
    try {
      console.log('Fetching metadata for URI:', metadataURI)
      
      // Clean the IPFS hash - remove any prefixes like ipfs://
      let cleanHash = metadataURI
      if (metadataURI.startsWith('ipfs://')) {
        cleanHash = metadataURI.replace('ipfs://', '')
      }
      
      console.log('Clean hash:', cleanHash)
      
      const metadata = await fetchFromIPFS(cleanHash) as CharityMetadata
      console.log('Fetched metadata:', metadata)
      
      setCharityMetadata(prev => ({ ...prev, [metadataURI]: metadata }))
    } catch (error) {
      console.error('Failed to fetch charity metadata:', error, 'for URI:', metadataURI)
      // Set an error state for this metadata
      setCharityMetadata(prev => ({ 
        ...prev, 
        [metadataURI]: { 
          name: '', 
          description: 'Failed to load description from IPFS' 
        } 
      }))
    } finally {
      setLoadingMetadata(prev => ({ ...prev, [metadataURI]: false }))
    }
  }

  // Function to copy address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Address copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy address')
    }
  }

  // Function to handle image load errors
  const handleImageError = (imageUrl: string) => {
    setBrokenImages(prev => new Set([...prev, imageUrl]))
  }

  // Debug logs for raw contract data
  console.log('CharityList - Raw contract data:', {
    data,
    isLoading,
    error,
    dataType: typeof data,
    isArray: Array.isArray(data)
  })

  const charities = data && Array.isArray(data) ? {
    ids: data[0] as bigint[],
    addresses: data[1] as string[],
    names: data[2] as string[],
    metadataURIs: data[3] as string[]
  } : null

  // Debug logs for parsed charity data
  if (charities) {
    console.log('CharityList - Parsed charity data:', {
      totalCharities: charities.addresses.length,
      ids: charities.ids,
      addresses: charities.addresses,
      names: charities.names,
      metadataURIs: charities.metadataURIs
    })
  }

  // Fetch metadata for all charities when data is available
  useEffect(() => {
    if (charities?.metadataURIs) {
      console.log('useEffect triggered - fetching metadata for URIs:', charities.metadataURIs)
      charities.metadataURIs.forEach((uri, index) => {
        if (uri && uri.trim()) {
          console.log(`Triggering fetch for charity ${index} with URI:`, uri)
          fetchCharityMetadata(uri)
        } else {
          console.log(`Skipping fetch for charity ${index} - empty URI:`, uri)
        }
      })
    } else {
      console.log('useEffect - no metadataURIs available:', charities)
    }
  }, [charities?.metadataURIs])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading charities...</p>
      </div>
    )
  }

  if (error || !charities) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load charities</p>
      </div>
    )
  }

  if (charities.addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No charities registered yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Registered Charities 💝</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {charities.addresses.map((address, index) => {
          const rawName = charities.names[index]
          const metadataURI = charities.metadataURIs[index]
          const metadata = charityMetadata[metadataURI]
          const isLoadingMeta = loadingMetadata[metadataURI]
          
          // Debug logs for individual charity data
          console.log(`CharityList - Charity ${index} raw data:`, {
            index,
            address,
            rawName,
            metadataURI,
            metadata,
            isLoadingMeta
          })
          
          let displayName = 'Unknown Charity'
          let description = 'No description available'
          let website = ''
          let logo = ''
          
          try {
            // Use metadata name if available, otherwise use contract name
            if (metadata?.name) {
              displayName = metadata.name
            } else if (typeof rawName === 'string' && rawName.trim()) {
              displayName = rawName.trim()
            } else {
              displayName = `Charity #${Number(charities.ids[index])}`
            }
            
            // Use metadata description if available
            if (metadata?.description) {
              description = metadata.description
            } else if (isLoadingMeta) {
              description = 'Loading description...'
            } else if (metadataURI) {
              description = 'Failed to load description'
            }

            website = metadata?.website || ''
            logo = metadata?.logo || ''
            
          } catch (error) {
            console.error('Error parsing charity data:', error, { rawName, metadataURI })
            displayName = `Charity #${Number(charities.ids[index])}`
            description = 'Unable to load charity data'
          }
          
          return (
            <div key={index} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {logo && !brokenImages.has(logo) ? (
                        <img 
                          src={logo} 
                          alt={displayName} 
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(logo)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          🏢
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {displayName}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-gray-500 font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                    <button
                      onClick={() => copyToClipboard(address)}
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
                  </div>

                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      🌐 Visit Website
                    </a>
                  )}
                </div>
                
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Charity ID: {Number(charities.ids[index])}</span>
                  {isLoadingMeta && <span>⏳ Loading metadata...</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}