# EventProof — the evening's programme

*Photography for the night, sold one frame at a time.*

<picture><img src=".github/banner.svg" width="100%" alt="EventProof, Volume One — a dark botanical nocturne of lily-pads and white flowers with a gold flourish"></picture>

You hire a photographer for the wedding, the launch, the recital. Three hundred frames come back. The trouble has never been the shooting — it's the selling. Nobody wants the contact sheet. They want the one frame where the bride is mid-laugh, or the one where their kid finally looks at the camera. EventProof is built to sell that single frame, for the price of a coffee, and to hand the buyer something they can prove is theirs.

This is the run-of-show — read it like the printed programme handed to you at the door.

---

## Programme

| | |
|--|--|
| **Presented on** | Arc testnet — chain `5042002` |
| **The house** | `EventProof` (token symbol `EVPF`), an ERC-721 contract |
| **Box office** | `0x909b82B77050b340F77060C576f4742e2Ee45AB0` |
| **At the door** | [testnet.arcscan.app/address/0x909b82B77050b340F77060C576f4742e2Ee45AB0](https://testnet.arcscan.app/address/0x909b82B77050b340F77060C576f4742e2Ee45AB0) |
| **Doors** | [eventproof-nft.vercel.app](https://eventproof-nft.vercel.app/) *(currently gated behind access protection — the programme below describes the show regardless)* |

Settlement is in native USDC, six decimals. A list price of `100000` is ten cents. Nothing in this hall is denominated in a side-token you have to acquire first.

---

## The running order

The whole show is four acts. The first belongs to the photographer; the rest belong to whoever wants the frame.

**Act I — Hanging the frames.** The photographer (the contract `owner`) calls `listPhoto(uri, fileHash, price)`. Three things go up at once: an IPFS `uri` pointing at the metadata, a `fileHash` — the SHA-256 of the original hi-res file, stored as `bytes32` — and a `price` in USDC units. Each frame is handed an incrementing `photoId` and emits `PhotoListed`. Prices the front desk offers by default run small on purpose: $0.10, $0.15, $0.25, $0.50, $1.00.

**Act II — Walking the gallery.** A guest browses `getActivePhotos(offset, limit)`, paginated, no wallet required to look. Only frames still flagged `active` appear on the wall.

**Act III — Buying the one.** The guest calls `purchasePhoto(photoId)` and sends the exact price as `msg.value`. The contract checks three things before anything moves: the frame is still `active`, the amount is *exactly* the asking price, and this buyer hasn't already bought this frame (`purchaseRecord` must be empty for them). Pass all three and a proof NFT is minted to the buyer with the frame's metadata URI attached, the sale is tallied, and — in the same transaction — the full payment is forwarded straight to the photographer's address. The whole thing is wrapped in a reentrancy guard. It emits `PhotoPurchased`.

**Act IV — The encore the photographer controls.** `updatePrice(photoId, newPrice)` to re-price a frame, `delistPhoto(photoId)` to take it off the wall. Both are owner-only. A delisted frame stays on the record forever; it just can't be bought again.

There is no escrow, no waiting room, no claim-later step. Money and proof change hands in one call.

---

## Your proof

When you buy a frame you don't get a watermark and a promise. You get an ERC-721 token whose `tokenURI` resolves to the frame's metadata, and behind it the contract holds the `fileHash` — the SHA-256 of the exact file the photographer shot. Anyone can later check that the file someone is holding hashes to the value recorded on-chain. That's the "proof" in EventProof: a permanent, public line tying *this buyer* to *this exact frame*, with the photographer's address as the seller of record.

You can ask the contract about your own standing any time:

- `hasLicence(photoId, buyer)` — yes or no, do you hold this frame.
- `getLicenceToken(photoId, buyer)` — the token ID of your proof, or `0` if you never bought it.
- `photos(photoId)` — the full record: photographer, hash, price, whether it's active, how many sold, how much it earned.

---

## Booking & payment

Programme and contract by **Noah Leigh** ([@NoahLeigh](https://github.com/NoahLeigh)).

Bookings are walk-up: connect a wallet, pick a frame, pay the printed price in USDC. Listing is reserved for the photographer who deployed the house.

---

## Why this only works on a near-free settlement layer

Here is the honest economics of the show. A single frame is a sub-dollar sale — ten to thirty cents — and the guest wants *one shot*, not the whole gallery. That is the entire point of selling per-frame instead of per-album.

That business only exists if the rail underneath it is almost free to run. If moving thirty cents to the photographer costs a meaningful fraction of thirty cents, the sale is dead before it clears — you'd be forced back into selling bundles nobody asked for, just to amortise the friction. Arc lets the value being moved (USDC) settle directly to the photographer in the same call that mints the buyer's proof, at a per-transaction cost low enough that a dime sale still pays out as a dime sale. Charge for a coffee's worth of photo and have it land whole: that's only sane where the per-frame settlement rounds to nothing. Pull the cheap settlement out and you don't have a smaller version of this product — you have album sales again, which is the thing EventProof was built to replace.

---

## A note on the agents (so nobody's misled)

The live site carries an **Agent Simulation** panel. Be clear about what it is: a *client-side demo* that runs in your browser. A "buyer agent" reads the on-chain gallery via `getActivePhotos` and narrates which frame it would pick; a "counter agent" polls `getSessionStats()` and prints the running sales and USDC-earned totals to a little log. It illustrates the contract's read surface live — it does **not** sign transactions, it does **not** run autonomously on a server, and there is no agent-payment protocol behind it. Treat it as a showroom display, not a participant.

---

## Building the set

Contract: Solidity (pragma `^0.8.20`), compiled at `0.8.24` with the optimizer on (200 runs), built on OpenZeppelin v4 — `ERC721URIStorage`, `Ownable`, `ReentrancyGuard`. Toolchain is Hardhat.

```bash
npm install
npx hardhat test                 # the run-through
npx hardhat run scripts/deploy.ts --network arcTestnet
```

The front of house is a Next.js app under `frontend/`, talking to the chain through wagmi and viem. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the box-office address above and `NEXT_PUBLIC_CHAIN_ID` to `5042002`, then run the Next dev server from inside `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Fund a deployer wallet from the Arc testnet faucet before Act I. Everything after that is just the show.
