import { useReadContract, useWriteContract } from 'wagmi'
import { CONTRACTS } from '@/lib/config'
import GiftManagerABI from '@/abi/GiftManager.json'

export function useGiftManagerRead(functionName: string, args?: unknown[]) {
  return useReadContract({
    address: CONTRACTS.GIFT_MANAGER,
    abi: GiftManagerABI,
    functionName,
    args,
  })
}

export function useGiftManagerWrite() {
  return useWriteContract()
}

export function useGetCharities() {
  return useGiftManagerRead('getCharities')
}

export function useGetFavorites(userAddress?: string) {
  return useGiftManagerRead('getFavorites', userAddress ? [userAddress] : undefined)
}

export function useGetTopGifters() {
  return useGiftManagerRead('getTopGifters')
}

export function useGetGift(giftId?: number) {
  return useGiftManagerRead('gifts', giftId !== undefined ? [giftId] : undefined)
}