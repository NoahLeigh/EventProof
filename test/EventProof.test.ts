import { expect } from "chai";
import { ethers } from "hardhat";
import { EventProof } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EventProof", function () {
  let contract: EventProof;
  let owner: HardhatEthersSigner;
  let buyer1: HardhatEthersSigner;
  let buyer2: HardhatEthersSigner;

  const PHOTO_URI = "ipfs://QmTestHash123/metadata.json";
  const FILE_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-photo-file.jpg"));
  const PRICE_01 = ethers.parseUnits("0.10", 6);  // $0.10 in USDC (6 decimals)
  const PRICE_02 = ethers.parseUnits("0.20", 6);  // $0.20
  const PRICE_03 = ethers.parseUnits("0.30", 6);  // $0.30

  beforeEach(async function () {
    [owner, buyer1, buyer2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EventProof");
    contract = (await Factory.connect(owner).deploy()) as unknown as EventProof;
    await contract.waitForDeployment();
  });

  // ─── Deployment ──────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should have correct name and symbol", async function () {
      expect(await contract.name()).to.equal("EventProof");
      expect(await contract.symbol()).to.equal("EVPF");
    });

    it("should initialize session with zero stats", async function () {
      const [totalSales, totalEarned] = await contract.getSessionStats();
      expect(totalSales).to.equal(0n);
      expect(totalEarned).to.equal(0n);
    });
  });

  // ─── listPhoto ───────────────────────────────────────────────────────────────

  describe("listPhoto", function () {
    it("should allow owner to list a photo", async function () {
      const tx = await contract.listPhoto(PHOTO_URI, FILE_HASH, PRICE_01);
      await expect(tx)
        .to.emit(contract, "PhotoListed")
        .withArgs(1n, owner.address, FILE_HASH, PRICE_01, PHOTO_URI);

      const photo = await contract.photos(1n);
      expect(photo.id).to.equal(1n);
      expect(photo.photographer).to.equal(owner.address);
      expect(photo.metadataURI).to.equal(PHOTO_URI);
      expect(photo.price).to.equal(PRICE_01);
      expect(photo.active).to.equal(true);
      expect(photo.salesCount).to.equal(0n);
    });

    it("should increment photoId for each listing", async function () {
      await contract.listPhoto(PHOTO_URI, FILE_HASH, PRICE_01);
      await contract.listPhoto(PHOTO_URI + "2", FILE_HASH, PRICE_02);

      const photo1 = await contract.photos(1n);
      const photo2 = await contract.photos(2n);
      expect(photo1.id).to.equal(1n);
      expect(photo2.id).to.equal(2n);
    });

    it("should revert if non-owner tries to list", async function () {
      await expect(
        contract.connect(buyer1).listPhoto(PHOTO_URI, FILE_HASH, PRICE_01)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert on empty URI", async function () {
      await expect(
        contract.listPhoto("", FILE_HASH, PRICE_01)
      ).to.be.revertedWith("EventProof: empty URI");
    });

    it("should revert on zero fileHash", async function () {
      await expect(
        contract.listPhoto(PHOTO_URI, ethers.ZeroHash, PRICE_01)
      ).to.be.revertedWith("EventProof: empty fileHash");
    });

    it("should revert on zero price", async function () {
      await expect(
        contract.listPhoto(PHOTO_URI, FILE_HASH, 0n)
      ).to.be.revertedWith("EventProof: price must be > 0");
    });
  });

  // ─── purchasePhoto ───────────────────────────────────────────────────────────

  describe("purchasePhoto", function () {
    beforeEach(async function () {
      await contract.listPhoto(PHOTO_URI, FILE_HASH, PRICE_01);
    });

    it("should mint NFT and transfer payment on purchase", async function () {
      const photographerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await contract.connect(buyer1).purchasePhoto(1n, {
        value: PRICE_01,
      });
      const receipt = await tx.wait();

      await expect(tx)
        .to.emit(contract, "PhotoPurchased")
        .withArgs(1n, buyer1.address, 1n, PRICE_01);

      // Buyer owns NFT token #1
      expect(await contract.ownerOf(1n)).to.equal(buyer1.address);
      expect(await contract.tokenURI(1n)).to.equal(PHOTO_URI);

      // Photographer received payment
      const photographerBalanceAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = receipt ? receipt.gasUsed * BigInt(receipt.gasPrice) : 0n;
      expect(photographerBalanceAfter).to.be.gte(
        photographerBalanceBefore + PRICE_01 - gasUsed
      );
    });

    it("should update photo stats after purchase", async function () {
      await contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 });

      const photo = await contract.photos(1n);
      expect(photo.salesCount).to.equal(1n);
      expect(photo.totalEarned).to.equal(PRICE_01);
    });

    it("should update session stats after purchase", async function () {
      await contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 });
      const [totalSales, totalEarned] = await contract.getSessionStats();
      expect(totalSales).to.equal(1n);
      expect(totalEarned).to.equal(PRICE_01);
    });

    it("should track multiple purchases in session stats", async function () {
      await contract.listPhoto(PHOTO_URI + "2", FILE_HASH, PRICE_02);
      await contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 });
      await contract.connect(buyer2).purchasePhoto(2n, { value: PRICE_02 });

      const [totalSales, totalEarned] = await contract.getSessionStats();
      expect(totalSales).to.equal(2n);
      expect(totalEarned).to.equal(PRICE_01 + PRICE_02);
    });

    it("should revert with incorrect payment", async function () {
      await expect(
        contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_02 })
      ).to.be.revertedWith("EventProof: incorrect payment");
    });

    it("should revert on inactive photo", async function () {
      await contract.delistPhoto(1n);
      await expect(
        contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 })
      ).to.be.revertedWith("EventProof: photo not active");
    });

    it("should revert on duplicate purchase by same buyer", async function () {
      await contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 });
      await expect(
        contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 })
      ).to.be.revertedWith("EventProof: already purchased");
    });

    it("should allow two different buyers to purchase same photo", async function () {
      await contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 });
      await contract.connect(buyer2).purchasePhoto(1n, { value: PRICE_01 });

      expect(await contract.ownerOf(1n)).to.equal(buyer1.address);
      expect(await contract.ownerOf(2n)).to.equal(buyer2.address);
    });

    it("should record purchase correctly", async function () {
      await contract.connect(buyer1).purchasePhoto(1n, { value: PRICE_01 });
      expect(await contract.hasLicence(1n, buyer1.address)).to.equal(true);
      expect(await contract.hasLicence(1n, buyer2.address)).to.equal(false);
      expect(await contract.getLicenceToken(1n, buyer1.address)).to.equal(1n);
    });
  });

  // ─── delistPhoto ─────────────────────────────────────────────────────────────

  describe("delistPhoto", function () {
    beforeEach(async function () {
      await contract.listPhoto(PHOTO_URI, FILE_HASH, PRICE_01);
    });

    it("should delist a photo", async function () {
      await expect(contract.delistPhoto(1n))
        .to.emit(contract, "PhotoDelisted")
        .withArgs(1n);

      const photo = await contract.photos(1n);
      expect(photo.active).to.equal(false);
    });

    it("should revert if non-owner tries to delist", async function () {
      await expect(
        contract.connect(buyer1).delistPhoto(1n)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert on already delisted photo", async function () {
      await contract.delistPhoto(1n);
      await expect(contract.delistPhoto(1n)).to.be.revertedWith(
        "EventProof: not active"
      );
    });
  });

  // ─── updatePrice ─────────────────────────────────────────────────────────────

  describe("updatePrice", function () {
    beforeEach(async function () {
      await contract.listPhoto(PHOTO_URI, FILE_HASH, PRICE_01);
    });

    it("should update price", async function () {
      await expect(contract.updatePrice(1n, PRICE_03))
        .to.emit(contract, "PriceUpdated")
        .withArgs(1n, PRICE_03);

      const photo = await contract.photos(1n);
      expect(photo.price).to.equal(PRICE_03);
    });

    it("should revert on zero price", async function () {
      await expect(contract.updatePrice(1n, 0n)).to.be.revertedWith(
        "EventProof: price must be > 0"
      );
    });
  });

  // ─── getActivePhotos ─────────────────────────────────────────────────────────

  describe("getActivePhotos", function () {
    it("should return paginated active photos", async function () {
      await contract.listPhoto(PHOTO_URI + "1", FILE_HASH, PRICE_01);
      await contract.listPhoto(PHOTO_URI + "2", FILE_HASH, PRICE_02);
      await contract.listPhoto(PHOTO_URI + "3", FILE_HASH, PRICE_03);

      const [photos, total] = await contract.getActivePhotos(0n, 10n);
      expect(total).to.equal(3n);
      expect(photos.length).to.equal(3);
    });

    it("should exclude delisted photos from active count", async function () {
      await contract.listPhoto(PHOTO_URI + "1", FILE_HASH, PRICE_01);
      await contract.listPhoto(PHOTO_URI + "2", FILE_HASH, PRICE_02);
      await contract.delistPhoto(1n);

      const [photos, total] = await contract.getActivePhotos(0n, 10n);
      expect(total).to.equal(1n);
      expect(photos[0].id).to.equal(2n);
    });

    it("should support pagination", async function () {
      for (let i = 0; i < 5; i++) {
        await contract.listPhoto(
          PHOTO_URI + i,
          ethers.keccak256(ethers.toUtf8Bytes(`file${i}`)),
          PRICE_01
        );
      }

      const [page1, total] = await contract.getActivePhotos(0n, 3n);
      expect(total).to.equal(5n);
      expect(page1.length).to.equal(3);

      const [page2] = await contract.getActivePhotos(3n, 3n);
      expect(page2.length).to.equal(2);
    });
  });

  // ─── ERC-721 compliance ───────────────────────────────────────────────────────

  describe("ERC-721", function () {
    it("should support ERC-721 interface", async function () {
      expect(await contract.supportsInterface("0x80ac58cd")).to.equal(true);
    });

    it("should support ERC-721 metadata interface", async function () {
      expect(await contract.supportsInterface("0x5b5e139f")).to.equal(true);
    });
  });
});
