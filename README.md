# 🎁 GiftZap

**Send gifts and earn badges on Mantle Network with style and security**

GiftZap is a decentralized peer-to-peer micro-gifting platform built on Mantle Network L2 sepolia testnet, it allows uses to send MNT-based gifts with customizable messages, donate to charities, share gifts via X or whatsapp. The Platform awards ERC-721 Badge NFTs for milestones and charity donations. The frontend is built with Next.js (TypeScript), Privy for wallet authentication, Wagmi for contract interactions, Tailwind CSS v4 for styling, and Lottie for animations.


## ✨ Features

### 🎯 Core Functionality
- **Digital Gift Sending**: Send MNT tokens as gifts with personalized messages
- **Gift Redemption**: Recipients can redeem gifts through unique URLs
- **Charity Donations**: Dedicated charity giving with special recognition
- **Admin Dashboard**: Full charity management interface for platform owners
- **IPFS Integration**: Decentralized metadata storage for charities via Pinata
- **Social Sharing**: Share gifts via social media and QR codes
- **Mobile Responsive**: Full mobile support with intuitive UI

### 🏆 Gamification
- **Achievement Badges**: NFT badges for gift milestones (1, 5, 10 gifts)
- **Charity Badges**: Special badges for charitable donations
- **Leaderboard**: Top gifters ranking system
- **Favorites Management**: Save frequent recipients

### 🔐 Security & Reliability
- **Smart Contract Security**: OpenZeppelin-based contracts
- **Reentrancy Protection**: ReentrancyGuard implementation
- **Access Control**: Role-based permissions for NFT minting
- **Testnet Ready**: Deployed on Mantle Sepolia for safe testing

## 🏗️ Architecture

### Frontend (`/frontend`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom design system
- **Web3 Integration**: Wagmi + Viem for blockchain interactions
- **Authentication**: Privy for wallet management
- **State Management**: TanStack Query for server state
- **UI/UX**: Responsive design with animations and micro-interactions

### Smart Contracts (`/smart-contracts`)
- **GiftManager.sol**: Core contract managing gifts, charities, and favorites
- **BadgeNFT.sol**: ERC-721 contract for achievement badges
- **MockMNT.sol**: Test token for development
- **Development**: Foundry framework with comprehensive tests

### NFT Assets (`/nft-asset`)
- **Badge Images**: PNG assets for different achievement levels
- **Metadata**: JSON metadata for NFT badges
- **IPFS Integration**: Pinata for decentralized storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Foundry for smart contract development
- Git for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/7maylord/giftzap.git
cd giftzap
```

2. **Setup Frontend**
```bash
cd frontend
yarn install
cp .env.example 
# Configure environment variables
yarn run dev
```

3. **Setup Smart Contracts**
```bash
cd smart-contracts
forge install
forge build
forge test

forge script script/DeployWithCharities.s.sol:DeployWithCharities --rpc-url mantle_sepolia --broadcast --verify 
```

4. **Setup NFT Assets & Charity Management**
```bash
cd nft-asset
yarn install
# Configure Pinata credentials in .env
node upload.js

# Upload charity metadata (optional)
node upload-charities.js charities-example.json
```

### Environment Variables

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_GIFT_MANAGER_ADDRESS=0x5239E69677F1C112F42FDFCd7989d9982101224F
NEXT_PUBLIC_BADGE_NFT_ADDRESS=0xfdBe17eA174CD945CBD6bfC13A9E4Eb14392dfDd
NEXT_PUBLIC_MOCK_MNT_ADDRESS=0xE2056b401Fa9FE83ec3e0384aff076Be8eA5e283
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=your_pinata_gateway_url
```

#### Smart Contracts (`.env`)
```env
PRIVATE_KEY=your_private_key
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
```

#### NFT Assets (`.env`)
```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
```

## 📋 Smart Contract Details

### GiftManager Contract
- **Purpose**: Core business logic for gift management
- **Features**: 
  - Gift sending and redemption
  - Advanced charity management with IPFS metadata
  - Favorites system for frequent recipients
  - Achievement tracking and milestone rewards
  - Owner-only charity administration
- **Security**: ReentrancyGuard, Ownable pattern
- **Events**: Comprehensive event logging for UI updates
- **Storage**: IPFS-based charity metadata via Pinata integration

### BadgeNFT Contract
- **Standard**: ERC-721 with AccessControl
- **Badge Types**: 
  - Milestone badges (1, 5, 10 gifts)
  - Charity badges for donations
- **Metadata**: IPFS-hosted with standardized attributes
- **Upgradability**: Admin functions for URI updates

### Contract Addresses (Mantle Sepolia)
```
GiftManager: 0x5239E69677F1C112F42FDFCd7989d9982101224F
BadgeNFT: 0xfdBe17eA174CD945CBD6bfC13A9E4Eb14392dfDd
MockMNT: 0xE2056b401Fa9FE83ec3e0384aff076Be8eA5e283
```

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout
│   ├── admin/             # Admin dashboard
│   │   └── page.tsx       # Charity management interface
│   └── redeem/[giftId]/   # Gift redemption pages
├── components/            # Reusable UI components
│   ├── SendGiftForm.tsx   # Gift sending interface
│   ├── GiftHistory.tsx    # User's gift history
│   ├── TopGifters.tsx     # Leaderboard component
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useGiftManager.ts  # Smart contract interactions
│   └── useNetworkSwitch.ts # Network management
├── lib/                   # Utilities and configurations
│   ├── config.ts          # Wagmi and contract config
│   └── types.ts           # TypeScript definitions
└── utils/                 # Helper functions
    └── ipfs.ts           # IPFS metadata handling
```

### Key Features Implementation

#### Gift Sending Flow
1. User selects recipient and amount
2. Choose gift type and add message
3. Token approval (if needed)
4. Smart contract interaction
5. Success modal with sharing options

#### Badge System
- Automatic NFT minting on milestone achievements
- IPFS metadata with trait attributes
- Achievement notifications in UI

#### Admin Dashboard
- **Owner Authentication**: Automatic detection of contract owner
- **Charity Management**: Add, remove, and view charities
- **IPFS Integration**: Automatic metadata upload to Pinata
- **Real-time Updates**: Live charity data from smart contracts

#### Charity Management System
1. **JSON-based Setup**: Bulk upload charities via JSON file
2. **IPFS Storage**: Decentralized metadata with Pinata
3. **Smart Contract Integration**: Direct interaction with GiftManager
4. **Admin Interface**: User-friendly charity management dashboard

#### Responsive Design
- Mobile-first approach
- Progressive Web App features
- Optimized animations and interactions

## 🔧 Development

### Frontend Development
```bash
cd frontend
yarn run dev          # Start development server
yarn run build        # Build for production
yarn run lint         # Run ESLint
```

### Smart Contract Development
```bash
cd smart-contracts
forge build          # Compile contracts
forge test           # Run tests
forge test -vvv      # Verbose test output
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

### Testing
- **Frontend**: Jest and React Testing Library
- **Smart Contracts**: Foundry test suite
- **Integration**: End-to-end testing with Playwright

## 🚀 Deployment

### Smart Contract Deployment
```bash
cd smart-contracts
# Deploy to Mantle Sepolia with charities
forge script script/DeployWithCharities.s.sol:DeployWithCharities \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --broadcast \
  --verify

# Or deploy basic contracts first
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --broadcast \
  --verify
```

### Frontend Deployment
The frontend is optimized for deployment on:
- **Vercel** (recommended)
- **Netlify**

## 🤝 Contributing

We welcome contributions!

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Smart Contracts**: Solidity style guide
- **Commits**: Conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



## 🙏 Acknowledgments

- **Mantle Network** for blockchain infrastructure
- **OpenZeppelin** for secure smart contract libraries
- **Privy** for seamless wallet integration
- **Pinata** for IPFS storage solutions
- **Next.js & Vercel** for frontend framework and hosting

---

**Built with ❤️ on Mantle Network**

*GiftZap - Making generosity transparent, secure, and rewarding on the blockchain.*