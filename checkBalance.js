const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

const { rpcUrl, usdtAddress } = require("./settings");

const DIR = "./wallets"; // lets check wallet directory for balances

const walletsDir = path.join(process.cwd(), DIR);

const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"];

const provider = new ethers.JsonRpcProvider(rpcUrl);

// USDT contract instance
const usdtContract = new ethers.Contract(usdtAddress, erc20Abi, provider);

const getWalletsFromDirectory = () =>
  fs
    .readdirSync(walletsDir)
    .filter((file) => path.extname(file) === ".json")
    .map((file) => {
      try {
        return JSON.parse(
          fs.readFileSync(path.join(walletsDir, file), "utf-8")
        );
      } catch (error) {
        console.error(`Error parsing wallet file ${file}: ${error.message}`);
        return null;
      }
    });

const getMaticBalance = async (walletAddress) => {
  try {
    const balance = await provider.getBalance(walletAddress);
    return ethers.formatEther(balance); // MATIC balance in ETH format
  } catch (error) {
    console.error(
      `Error getting MATIC balance for ${walletAddress}: ${error.message}`
    );
    return 0;
  }
};

const getUsdtBalance = async (walletAddress) => {
  try {
    const balance = await usdtContract.balanceOf(walletAddress);
    return ethers.formatUnits(balance, 6); // USDT uses 6 decimal places
  } catch (error) {
    console.error(
      `Error getting USDT balance for ${walletAddress}: ${error.message}`
    );
    return 0;
  }
};

// Check balances for all wallets in the directory
const checkWalletBalances = async () => {
  const wallets = getWalletsFromDirectory();

  let totalMatic = 0;
  let totalUsdt = 0;

  console.log(`Checking balances for ${wallets.length} wallets...`);

  for (const wallet of wallets) {
    const walletAddress = wallet.address;

    const [maticBalance, usdtBalance] = await Promise.all([
      getMaticBalance(walletAddress),
      getUsdtBalance(walletAddress),
    ]);

    console.log(
      `${walletAddress} - MATIC: ${maticBalance}, USDT: ${usdtBalance}`
    );

    totalMatic += parseFloat(maticBalance);
    totalUsdt += parseFloat(usdtBalance);
  }

  console.log("\n--- Summary ---");
  console.log(`Total MATIC balance: ${totalMatic}`);
  console.log(`Total USDT balance: ${totalUsdt}`);
};

checkWalletBalances().catch((error) => {
  console.error(`Error checking wallet balances: ${error.message}`);
});
