import { create } from 'ipfs-http-client'

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

// Create IPFS client for Pinata
const createIPFSClient = () => {
  if (!PINATA_JWT) {
    console.warn('PINATA_JWT not found in environment variables')
  }
  console.log('Using Pinata IPFS service')
  return create({
    host: 'api.pinata.cloud',
    port: 443,
    protocol: 'https',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
  })
}

const ipfs = createIPFSClient()

// Get appropriate gateway URL
const getGatewayUrl = (cid: string): string => {
  if (PINATA_GATEWAY) {
    return `${PINATA_GATEWAY}/ipfs/${cid}`
  } else {
    return `https://gateway.pinata.cloud/ipfs/${cid}`
  }
}

export async function uploadToIPFS(data: unknown): Promise<string> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured')
    }

    const jsonData = JSON.stringify(data)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const result = await ipfs.add(buffer, {
      pin: true,
      wrapWithDirectory: false,
    })

    console.log(`Uploaded to IPFS: ${result.cid.toString()}`)
    return result.cid.toString()
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
    const url = getGatewayUrl(cid)
    console.log(`Fetching from IPFS: ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('IPFS fetch failed:', error)
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