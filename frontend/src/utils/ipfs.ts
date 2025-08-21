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
    const jsonData = JSON.stringify(data)
    const file = new File([jsonData], 'metadata.json', { type: 'application/json' })

    const result = await pinata.upload.file(file)
    
    console.log(`Uploaded to IPFS: ${result.IpfsHash}`)
    return result.IpfsHash
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
    console.log('Fetching from IPFS with CID:', cid)
    console.log('Environment check - PINATA_JWT exists:', !!PINATA_JWT)
    console.log('Environment check - PINATA_GATEWAY:', PINATA_GATEWAY)
    console.log('Pinata client initialized:', !!pinata)
    
    // Use direct gateway fetch as primary method since it's more reliable
    const gatewayUrl = getGatewayUrl(cid)
    console.log('Fetching directly from gateway:', gatewayUrl)
    
    const response = await fetch(gatewayUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Direct fetch response:', data)
    return data
    
  } catch (error) {
    console.error('IPFS fetch failed:', error)
    
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
        console.log('Trying alternative gateway:', gatewayUrl)
        const response = await fetch(gatewayUrl)
        if (response.ok) {
          const data = await response.json()
          console.log('Alternative gateway success:', data)
          return data
        }
      } catch (altError) {
        console.warn('Alternative gateway failed:', gatewayUrl, altError)
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