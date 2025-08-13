export interface Charity {
  id: number
  address: string
  name: string
  descriptionHash: string
}

export interface Favorite {
  recipient: string
  name: string
  giftCount: number
  totalAmount: bigint
}

export interface Gift {
  sender: string
  recipient: string
  amount: bigint
  giftTypeHash: string
  messageHash: string
  isCharity: boolean
  redeemed: boolean
  timestamp: bigint
}

export interface TopGifter {
  address: string
  count: number
}