import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("─────────────────────────────────────────");
  console.log("  EventProof — Deploy Script");
  console.log("─────────────────────────────────────────");
  console.log(`Network: ${network.name} (chainId: ${network.config.chainId})`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:  ${ethers.formatUnits(balance, 6)} USDC`);

  if (balance === 0n) {
    throw new Error(
      "Deployer has zero balance. Fund your wallet from https://faucet.testnet.arc.network"
    );
  }

  console.log("\nDeploying EventProof...");
  const EventProof = await ethers.getContractFactory("EventProof");
  const contract = await EventProof.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✓ EventProof deployed to: ${address}`);
  console.log(`  Explorer: https://testnet.arcscan.app/address/${address}`);

  // Save deployment info for frontend
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also write to frontend env file location
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\nNEXT_PUBLIC_CHAIN_ID=5042002\n`;

  try {
    let existing = "";
    if (fs.existsSync(frontendEnvPath)) {
      existing = fs.readFileSync(frontendEnvPath, "utf-8");
      existing = existing
        .split("\n")
        .filter(
          (l) =>
            !l.startsWith("NEXT_PUBLIC_CONTRACT_ADDRESS=") &&
            !l.startsWith("NEXT_PUBLIC_CHAIN_ID=")
        )
        .join("\n");
    }
    fs.writeFileSync(frontendEnvPath, existing + "\n" + envContent);
  } catch {
    // frontend dir may not exist yet; deployment info is in deployments/
  }

  console.log(`\n✓ Deployment info saved to deployments/${network.name}.json`);
  console.log("\n─────────────────────────────────────────");
  console.log("  Next steps:");
  console.log(`  1. Set CONTRACT_ADDRESS=${address} in frontend/.env.local`);
  console.log(
    `  2. Verify: npx hardhat verify --network arcTestnet ${address} ${deployer.address}`
  );
  console.log("─────────────────────────────────────────\n");

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
