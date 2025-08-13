import { createConfig, http } from 'wagmi'
import { mantleSepoliaTestnet } from 'wagmi/chains'

export const config = createConfig({
  chains: [mantleSepoliaTestnet],
  transports: {
    [mantleSepoliaTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL as string)
  }
})

export const CONTRACTS = {
  GIFT_MANAGER: process.env.NEXT_PUBLIC_GIFT_MANAGER_ADDRESS as `0x${string}`,
  BADGE_NFT: process.env.NEXT_PUBLIC_BADGE_NFT_ADDRESS as `0x${string}`,
  MOCK_MNT: process.env.NEXT_PUBLIC_MOCK_MNT_ADDRESS as `0x${string}`
}