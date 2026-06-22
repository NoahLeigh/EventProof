import { parseAbi } from "viem";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x909b82B77050b340F77060C576f4742e2Ee45AB0") as `0x${string}`;

export const ARC_TESTNET_CHAIN_ID = 5042002;

export const EVENT_PROOF_ABI = parseAbi([
  // Read
  "function photos(uint256) view returns (uint256 id, address photographer, string metadataURI, bytes32 fileHash, uint256 price, bool active, uint256 salesCount, uint256 totalEarned)",
  "function getActivePhotos(uint256 offset, uint256 limit) view returns ((uint256 id, address photographer, string metadataURI, bytes32 fileHash, uint256 price, bool active, uint256 salesCount, uint256 totalEarned)[] result, uint256 total)",
  "function getSessionStats() view returns (uint256 totalSales, uint256 totalEarned, uint256 sessionDuration)",
  "function hasLicence(uint256 photoId, address buyer) view returns (bool)",
  "function getLicenceToken(uint256 photoId, address buyer) view returns (uint256)",
  "function getAllPhotoIds() view returns (uint256[])",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function owner() view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  // Write
  "function purchasePhoto(uint256 photoId) payable returns (uint256 tokenId)",
  "function listPhoto(string uri, bytes32 fileHash, uint256 price) returns (uint256 photoId)",
  "function delistPhoto(uint256 photoId)",
  "function updatePrice(uint256 photoId, uint256 newPrice)",
  // Events
  "event PhotoListed(uint256 indexed photoId, address indexed photographer, bytes32 fileHash, uint256 price, string metadataURI)",
  "event PhotoPurchased(uint256 indexed photoId, address indexed buyer, uint256 indexed tokenId, uint256 price)",
  "event PhotoDelisted(uint256 indexed photoId)",
  "event PriceUpdated(uint256 indexed photoId, uint256 newPrice)",
]);

export type Photo = {
  id: bigint;
  photographer: string;
  metadataURI: string;
  fileHash: string;
  price: bigint;
  active: boolean;
  salesCount: bigint;
  totalEarned: bigint;
  // UI extras (resolved from metadata)
  imageUrl?: string;
  title?: string;
  description?: string;
  location?: string;
  shotDate?: string;
  category?: string;
};

export function formatUsdc(wei: bigint): string {
  const usdc = Number(wei) / 1_000_000;
  return usdc.toFixed(2);
}

export function usdcToWei(amount: number): bigint {
  return BigInt(Math.round(amount * 1_000_000));
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
