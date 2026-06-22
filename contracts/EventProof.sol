// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EventProof
 * @notice Photo licensing platform — pay native USDC (ARC Testnet native token),
 *         receive a proof-of-purchase ERC-721 NFT with file hash on-chain.
 * @dev    ERC-721 (OpenZeppelin v4). Photographer receives funds directly on purchase.
 */
contract EventProof is ERC721URIStorage, Ownable, ReentrancyGuard {
    // ─── State ─────────────────────────────────────────────────────────────────

    uint256 private _nextTokenId;
    uint256 private _nextPhotoId;

    struct Photo {
        uint256 id;
        address photographer;
        string  metadataURI;    // IPFS metadata URI
        bytes32 fileHash;       // SHA-256 hash of the original file
        uint256 price;          // price in native units (USDC on ARC, 6 decimals)
        bool    active;
        uint256 salesCount;
        uint256 totalEarned;
    }

    struct SessionStats {
        uint256 totalSales;
        uint256 totalEarned;
        uint256 startTime;
    }

    // photoId → Photo
    mapping(uint256 => Photo) public photos;
    // tokenId → photoId
    mapping(uint256 => uint256) public tokenToPhoto;
    // photoId → buyer → tokenId (0 = not purchased)
    mapping(uint256 => mapping(address => uint256)) public purchaseRecord;

    SessionStats private _session;
    uint256[] private _allPhotoIds;

    // ─── Events ────────────────────────────────────────────────────────────────

    event PhotoListed(
        uint256 indexed photoId,
        address indexed photographer,
        bytes32 fileHash,
        uint256 price,
        string  metadataURI
    );

    event PhotoPurchased(
        uint256 indexed photoId,
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 price
    );

    event PhotoDelisted(uint256 indexed photoId);
    event PriceUpdated(uint256 indexed photoId, uint256 newPrice);

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor() ERC721("EventProof", "EVPF") {
        _session.startTime = block.timestamp;
        _nextTokenId = 1;
        _nextPhotoId = 1;
    }

    // ─── Photographer functions ────────────────────────────────────────────────

    /**
     * @notice List a photo for sale. Only callable by the contract owner (photographer).
     * @param uri       IPFS URI for NFT metadata JSON
     * @param fileHash  SHA-256 hash of the original hi-res file (bytes32)
     * @param price     Price in native token (USDC, 6 decimals). 100000 = $0.10
     */
    function listPhoto(
        string  calldata uri,
        bytes32 fileHash,
        uint256 price
    ) external onlyOwner returns (uint256 photoId) {
        require(bytes(uri).length > 0, "EventProof: empty URI");
        require(fileHash != bytes32(0), "EventProof: empty fileHash");
        require(price > 0,              "EventProof: price must be > 0");

        photoId = _nextPhotoId++;

        photos[photoId] = Photo({
            id:           photoId,
            photographer: msg.sender,
            metadataURI:  uri,
            fileHash:     fileHash,
            price:        price,
            active:       true,
            salesCount:   0,
            totalEarned:  0
        });

        _allPhotoIds.push(photoId);
        emit PhotoListed(photoId, msg.sender, fileHash, price, uri);
    }

    /**
     * @notice Delist a photo so it can no longer be purchased.
     */
    function delistPhoto(uint256 photoId) external onlyOwner {
        require(photos[photoId].active, "EventProof: not active");
        photos[photoId].active = false;
        emit PhotoDelisted(photoId);
    }

    /**
     * @notice Update the price of an active photo.
     */
    function updatePrice(uint256 photoId, uint256 newPrice) external onlyOwner {
        require(photos[photoId].active, "EventProof: not active");
        require(newPrice > 0,           "EventProof: price must be > 0");
        photos[photoId].price = newPrice;
        emit PriceUpdated(photoId, newPrice);
    }

    // ─── Buyer functions ───────────────────────────────────────────────────────

    /**
     * @notice Purchase a photo licence. Send exact price as msg.value.
     *         Mints a proof-of-purchase NFT to the buyer and pays the photographer.
     */
    function purchasePhoto(uint256 photoId)
        external
        payable
        nonReentrant
        returns (uint256 tokenId)
    {
        Photo storage photo = photos[photoId];
        require(photo.active,             "EventProof: photo not active");
        require(msg.value == photo.price, "EventProof: incorrect payment");
        require(
            purchaseRecord[photoId][msg.sender] == 0,
            "EventProof: already purchased"
        );

        // Mint NFT
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, photo.metadataURI);

        tokenToPhoto[tokenId] = photoId;
        purchaseRecord[photoId][msg.sender] = tokenId;

        // Update stats
        photo.salesCount++;
        photo.totalEarned += msg.value;
        _session.totalSales++;
        _session.totalEarned += msg.value;

        // Pay photographer
        (bool sent, ) = payable(photo.photographer).call{value: msg.value}("");
        require(sent, "EventProof: payment transfer failed");

        emit PhotoPurchased(photoId, msg.sender, tokenId, msg.value);
    }

    // ─── View functions ────────────────────────────────────────────────────────

    /**
     * @notice Returns session aggregate stats for the counter agent.
     */
    function getSessionStats()
        external
        view
        returns (
            uint256 totalSales,
            uint256 totalEarned,
            uint256 sessionDuration
        )
    {
        totalSales      = _session.totalSales;
        totalEarned     = _session.totalEarned;
        sessionDuration = block.timestamp - _session.startTime;
    }

    /**
     * @notice Returns all photo IDs ever listed (including inactive).
     */
    function getAllPhotoIds() external view returns (uint256[] memory) {
        return _allPhotoIds;
    }

    /**
     * @notice Returns paginated active photos for gallery display.
     */
    function getActivePhotos(uint256 offset, uint256 limit)
        external
        view
        returns (Photo[] memory result, uint256 total)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < _allPhotoIds.length; i++) {
            if (photos[_allPhotoIds[i]].active) count++;
        }
        total = count;

        if (offset >= count || limit == 0) {
            result = new Photo[](0);
            return (result, total);
        }

        uint256 size = offset + limit > count ? count - offset : limit;
        result = new Photo[](size);

        uint256 idx  = 0;
        uint256 seen = 0;
        for (uint256 i = 0; i < _allPhotoIds.length && idx < size; i++) {
            Photo storage p = photos[_allPhotoIds[i]];
            if (p.active) {
                if (seen >= offset) {
                    result[idx++] = p;
                }
                seen++;
            }
        }
    }

    /**
     * @notice Returns true if the buyer already owns a licence for this photo.
     */
    function hasLicence(uint256 photoId, address buyer) external view returns (bool) {
        return purchaseRecord[photoId][buyer] != 0;
    }

    /**
     * @notice Returns the NFT token ID representing buyer's licence (0 = none).
     */
    function getLicenceToken(uint256 photoId, address buyer) external view returns (uint256) {
        return purchaseRecord[photoId][buyer];
    }
}
