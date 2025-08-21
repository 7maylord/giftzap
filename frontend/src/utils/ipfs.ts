import { PinataSDK } from 'pinata'

interface GiftMetadata {
  giftType: string
  message: string
  timestamp: number
  sender?: string
}

interface CharityMetadata {
  name: string
  description: string
  logo?: string
  website?: string
}

// Environment configuration
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY

// Create Pinata client
const createPinataClient = () => {
  if (!PINATA_JWT) {
    console.warn('PINATA_JWT not found in environment variables')
    // Don't throw error, we'll use fallback
    return null
  }
  console.log('Using Pinata IPFS service')
  try {
    return new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY || 'gateway.pinata.cloud'
    })
  } catch (error) {
    console.error('Failed to create Pinata client:', error)
    return null
  }
}

const pinata = createPinataClient()

// Get appropriate gateway URL
const getGatewayUrl = (cid: string): string => {
  // Use your custom Pinata gateway
  const customGateway = 'https://gold-perfect-rook-553.mypinata.cloud/ipfs'
  
  if (PINATA_GATEWAY) {
    return `${PINATA_GATEWAY}/ipfs/${cid}`
  } else {
    return `${customGateway}/${cid}`
  }
}

export async function uploadToIPFS(data: unknown): Promise<string> {
  try {
    if (!pinata) {
      throw new Error('Pinata client not initialized - check PINATA_JWT environment variable')
    }

    const jsonData = JSON.stringify(data)

    // For Pinata SDK v2, try the correct method names
    let result;
    try {
      // Method 1: Direct JSON upload
      result = await (pinata as any).upload.json(data)
    } catch (jsonError) {
      try {
        // Method 2: File upload  
        const file = new File([jsonData], 'metadata.json', { type: 'application/json' })
        result = await (pinata as any).upload.file(file)
      } catch (fileError) {
        try {
          // Method 3: Direct API call using fetch (fallback)
          const formData = new FormData()
          const blob = new Blob([jsonData], { type: 'application/json' })
          formData.append('file', blob, 'metadata.json')
          
          const pinataMetadata = JSON.stringify({
            name: 'charity-metadata.json'
          })
          formData.append('pinataMetadata', pinataMetadata)

          const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PINATA_JWT}`,
            },
            body: formData
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          result = await response.json()
        } catch (apiError) {
          throw new Error(`All Pinata upload methods failed. Last error: ${apiError}`)
        }
      }
    }
    
    // Handle different response formats
    const ipfsHash = result.IpfsHash || result.ipfsHash || result.cid || result.hash
    if (!ipfsHash) {
      throw new Error('No IPFS hash returned from Pinata')
    }
    
    return ipfsHash
  } catch (error) {
    console.error('IPFS upload failed:', error)
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function uploadGiftMetadata(giftData: GiftMetadata): Promise<string> {
  const metadata = {
    ...giftData,
    timestamp: Date.now(),
  }
  
  return uploadToIPFS(metadata)
}

export async function uploadCharityMetadata(charityData: CharityMetadata): Promise<string> {
  return uploadToIPFS(charityData)
}

export async function fetchFromIPFS(cid: string): Promise<unknown> {
  try {
    // Use direct gateway fetch as primary method since it's more reliable
    const gatewayUrl = getGatewayUrl(cid)
    
    const response = await fetch(gatewayUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
    
  } catch (error) {
    // Try alternative gateways as fallback
    const alternativeGateways = [
      `https://gold-perfect-rook-553.mypinata.cloud/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`
    ]
    
    for (const gatewayUrl of alternativeGateways) {
      try {
        const response = await fetch(gatewayUrl)
        if (response.ok) {
          const data = await response.json()
          return data
        }
      } catch (altError) {
        // Silent fail, try next gateway
      }
    }
    
    throw new Error(`Failed to fetch from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function fetchGiftMetadata(cid: string): Promise<GiftMetadata> {
  return fetchFromIPFS(cid) as Promise<GiftMetadata>
}

export async function fetchCharityMetadata(cid: string): Promise<CharityMetadata> {
  return fetchFromIPFS(cid) as Promise<CharityMetadata>
}

// Helper function to convert string to bytes32 hash (for contract compatibility)
export function stringToBytes32Hash(str: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  
  // Simple hash function for demonstration - in production use a proper hash
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data[i]
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to hex and pad to 32 bytes (64 hex characters)
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0')
}

// Helper to extract IPFS hash from bytes32 (if stored directly)
export function bytes32ToIPFSHash(bytes32: string): string {
  // Remove 0x prefix and convert back
  const hex = bytes32.slice(2)
  // This is simplified - in production you'd store the actual IPFS hash
  return hex
}