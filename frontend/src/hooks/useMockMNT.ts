import { useReadContract, useWriteContract } from 'wagmi'
import { CONTRACTS } from '@/lib/config'
import MockMNTABI from '@/abi/MockMNT.json'

export function useMockMNTRead(functionName: string, args?: unknown[]) {
  return useReadContract({
    address: CONTRACTS.MOCK_MNT,
    abi: MockMNTABI,
    functionName,
    args,
  })
}

export function useMockMNTWrite() {
  return useWriteContract()
}

export function useTokenBalance(userAddress?: string) {
  return useMockMNTRead('balanceOf', userAddress ? [userAddress] : undefined)
}

export function useTokenAllowance(owner?: string, spender?: string) {
  return useMockMNTRead('allowance', owner && spender ? [owner, spender] : undefined)
}