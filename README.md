# EventProof

**On-chain photo licensing. Pay USDC, own the proof.**

EventProof is a decentralised photo marketplace built on the ARC Testnet. Photographers list their frames on-chain; buyers pay USDC and receive an ERC-721 NFT as a permanent, verifiable proof of purchase — no middlemen, no expiry, no bullshit.

---

## What it does

- 📸 **List frames** — photographers upload metadata to IPFS and register a SHA-256 file hash on-chain
- 💳 **Buy licences** — pay native USDC directly to the photographer, receive an NFT instantly
- 🔒 **Immutable proof** — every purchase lives forever on ARC blockchain
- 🤖 **Agent simulation** — a built-in buyer + counter agent demos live contract interaction

---

## Stack

| Layer | Tech |
|---|---|
| Smart contract | Solidity 0.8.24 · OpenZeppelin v4 · Hardhat |
| Chain | ARC Testnet (Chain ID 5042002) |
| Frontend | Next.js 14 · Wagmi v2 · Viem · Tailwind CSS |
| Storage | IPFS (Pinata / ipfs.io) |

---

## Contract

| | |
|---|---|
| Address | `0x909b82B77050b340F77060C576f4742e2Ee45AB0` |
| Network | ARC Testnet |
| Explorer | [testnet.arcscan.app](https://testnet.arcscan.app/address/0x909b82B77050b340F77060C576f4742e2Ee45AB0#code) |
| Status | ✅ Verified |

---

## Live

**[eventproof-nft.vercel.app](https://eventproof-nft.vercel.app)**
