# EventProof

> On-chain photo licensing for photographers. Pay USDC, receive a proof-of-purchase NFT. Built on [ARC Testnet](https://testnet.arcscan.app).

![ARC Testnet](https://img.shields.io/badge/network-ARC%20Testnet-6272f1)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Overview

EventProof solves the photo licensing problem for freelance photographers: a client wants a specific frame from a wedding, portrait or corporate shoot, but sending high-res originals without payment is risky. With EventProof:

1. Photographer lists frames with a price ($0.10–$0.30 USDC) and a SHA-256 hash of the original file.
2. Client pays native USDC (ARC's gas token) on-chain.
3. Smart contract mints a **proof-of-purchase ERC-721 NFT** to the buyer with the file hash embedded.
4. Payment goes directly to the photographer — no intermediary.

---

## Architecture

```
EventProof/
├── contracts/
│   └── EventProof.sol          # ERC-721 + Ownable + ReentrancyGuard
├── scripts/
│   └── deploy.ts               # Hardhat deploy script
├── test/
│   └── EventProof.test.ts      # 28 tests, all passing
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Gallery + hero + agent panel
│       │   ├── dashboard/      # Photographer stats dashboard
│       │   └── list/           # List a new photo frame
│       ├── components/
│       │   ├── Navbar.tsx      # Wallet connect / disconnect
│       │   ├── PhotoCard.tsx   # Purchase flow per frame
│       │   └── AgentPanel.tsx  # Buyer + counter agents
│       └── lib/
│           ├── contract.ts     # ABI + helpers
│           └── wagmi.ts        # ARC Testnet chain config
└── deployments/                # Created after deploy
```

---

## Smart Contract

**`EventProof.sol`** — ERC-721 photo licence NFT

| Function | Access | Description |
|---|---|---|
| `listPhoto(uri, fileHash, price)` | Owner only | List a frame for sale |
| `delistPhoto(photoId)` | Owner only | Remove a frame from sale |
| `updatePrice(photoId, newPrice)` | Owner only | Update frame price |
| `purchasePhoto(photoId)` | Anyone | Pay USDC → mint NFT |
| `getActivePhotos(offset, limit)` | View | Paginated gallery |
| `getSessionStats()` | View | Sales count + earnings |
| `hasLicence(photoId, buyer)` | View | Check ownership |

---

## ARC Testnet

| Parameter | Value |
|---|---|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Native token | USDC (6 decimals) |
| Faucet | `https://faucet.testnet.arc.network` |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or any EVM-compatible wallet
- ARC Testnet USDC from the faucet

### 1. Install dependencies

```bash
# Contract
cd EventProof
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure environment

```bash
# Contract (for deployment)
cp .env.example .env
# Edit .env and add your DEPLOYER_PRIVATE_KEY

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edit and add NEXT_PUBLIC_CONTRACT_ADDRESS after deploy
```

### 3. Compile & test contract

```bash
npm run compile
npm test
# Expected: 28 passing
```

### 4. Deploy contract to ARC Testnet

```bash
npm run deploy:testnet
```

This will:
- Deploy the contract from your wallet
- Print the contract address
- Save deployment info to `deployments/arcTestnet.json`

### 5. Run the frontend

```bash
cd frontend
# Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local
npm run dev
# Open http://localhost:3000
```

---

## Deployment

### Contract deployment

```bash
# Set your private key in .env
DEPLOYER_PRIVATE_KEY=your_key_here

# Deploy
npm run deploy:testnet

# Verify (optional)
npx hardhat verify --network arcTestnet <CONTRACT_ADDRESS>
```

### Frontend production build

```bash
cd frontend
npm run build
npm run start
```

---

## Agents

EventProof includes two autonomous agents accessible from the main gallery page:

- **Buyer Agent** — polls the gallery every 8 seconds, selects a random active frame, and logs its selection. Real purchases require wallet signature.
- **Counter Agent** — polls `getSessionStats()` from the contract every 10 seconds and displays live: total sales count and total USDC earned.

---

## License

MIT — see [LICENSE](LICENSE)
