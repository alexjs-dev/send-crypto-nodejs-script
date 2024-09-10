const { parentPort, workerData } = require("worker_threads");
const ethers = require("ethers");
const {
  parentPrivateKey,
  destinationAddress,
  usdtAddress,
  amountToSendUSDT,
  gasFeeMATIC,
  rpcUrl: providerUrl,
  PARALLEL_PROCESSING,
} = require("./settings");

const { walletData, workerIndex } = workerData;

const provider = new ethers.JsonRpcProvider(providerUrl);
const parentWallet = new ethers.Wallet(parentPrivateKey, provider);

const erc20Abi = [
  "function transfer(address to, uint amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

const tokenContract = new ethers.Contract(usdtAddress, erc20Abi, parentWallet);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCurrentFeeData = async () => {
  const { gasPrice } = await provider.getFeeData();
  return gasPrice;
};

const checkTxStatus = async (txHash, retries = 300, timeout = 10000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) return receipt;

      console.log(
        `${
          walletData.address
        } - Transaction ${txHash} not yet confirmed. Retrying... (${
          attempt + 1
        }/${retries})`
      );
      await sleep(timeout);
    } catch (error) {
      console.error(
        `${walletData.address} - Error checking transaction: ${error.message}`
      );
    }
  }

  console.error(
    `${walletData.address} - Transaction ${txHash} not found after ${retries} attempts. Possible dropped transaction.`
  );
  throw new Error(`Transaction ${txHash} not found or dropped.`);
};

const getNonce = async (walletAddress) => {
  try {
    const nonce = await provider.getTransactionCount(walletAddress, "latest");
    console.log(`${walletAddress} - Retrieved nonce: ${nonce}`);
    return nonce;
  } catch (error) {
    console.error(`${walletAddress} - Error fetching nonce: ${error.message}`);
    throw error;
  }
};

const sendTransactionWithRetries = async (
  sendTransactionFn,
  retries = 5,
  walletAddress
) => {
  let gasPrice = await getCurrentFeeData();
  let nonce = await getNonce(walletAddress);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await sendTransactionFn(gasPrice, nonce);
    } catch (error) {
      if (
        error.code === "REPLACEMENT_UNDERPRICED" ||
        error.code === "TRANSACTION_UNDERPRICED"
      ) {
        gasPrice = (gasPrice * BigInt(110)) / BigInt(100); // Increase gas price by 10%
        console.log(
          `${walletAddress} - Retrying with higher gas price: ${ethers.formatUnits(
            gasPrice,
            "gwei"
          )} gwei (Attempt ${attempt + 2}/${retries})`
        );
      } else if (
        error.code === "NONCE_EXPIRED" ||
        error.code === "NONCE_TOO_LOW"
      ) {
        nonce = await getNonce(walletAddress);
        console.log(
          `${walletAddress} - Nonce issue detected: ${error.message}. Fetching new nonce.`
        );
      } else {
        console.error(`${walletAddress} - Unexpected error: ${error.message}`);
        throw error;
      }
    }
  }

  throw new Error(`${walletAddress} - Failed after ${retries} attempts.`);
};

const processWallet = async (wallet) => {
  const newWallet = new ethers.Wallet(wallet.privateKey, provider);
  const amountInWei = ethers.parseUnits(amountToSendUSDT, 6);

  if (PARALLEL_PROCESSING) {
    // my attempt to fix chain dropping transactions lol
    console.log(`${wallet.address} - Sleeping for ${workerIndex * 1000} ms`);
    await sleep(workerIndex * 1000);
  }

  try {
    console.log(
      `${wallet.address} - About to send ${ethers.formatUnits(
        amountInWei,
        6
      )} USDT`
    );

    // Transfer USDT from parent wallet to child wallet
    await sendTransactionWithRetries(
      async (gasPrice, nonce) => {
        const tx = await tokenContract.transfer(wallet.address, amountInWei, {
          gasPrice,
          nonce,
        });
        await checkTxStatus(tx.hash);
        console.log(
          `${wallet.address} - ${amountToSendUSDT} USDT sent from parent wallet`
        );
      },
      5,
      parentWallet.address
    );

    // Transfer MATIC for gas fees
    await sendTransactionWithRetries(
      async (gasPrice, nonce) => {
        const tx = await parentWallet.sendTransaction({
          to: wallet.address,
          value: ethers.parseEther(gasFeeMATIC),
          gasPrice,
          nonce,
        });
        await checkTxStatus(tx.hash);
        console.log(
          `${wallet.address} - ${gasFeeMATIC} MATIC sent from parent to cover gas fees`
        );
      },
      5,
      parentWallet.address
    );

    // Wait for a short delay before forwarding USDT
    console.log(
      `${wallet.address} - Waiting 10 seconds before forwarding USDT...`
    );
    await sleep(10000);

    // Forward USDT from child wallet to destination address
    await sendTransactionWithRetries(
      async (gasPrice, nonce) => {
        const tokenContractWithNewWallet = new ethers.Contract(
          usdtAddress,
          erc20Abi,
          newWallet
        );
        await tokenContractWithNewWallet.transfer(
          destinationAddress,
          amountInWei,
          { gasPrice, nonce }
        );
        console.log(
          `${wallet.address} - ${amountToSendUSDT} USDT forwarded to destination: ${destinationAddress}`
        );
      },
      5,
      newWallet.address
    );
  } catch (error) {
    console.error(
      `${wallet.address} - Error processing wallet: ${error.message}`
    );
    throw error;
  }
};

processWallet(walletData)
  .then(() => {
    console.log(`${walletData.address} - Processing completed successfully`);
    parentPort.postMessage({ success: true });
  })
  .catch((error) => {
    console.error(
      `${walletData.address} - Error in processing: ${error.message}`
    );
    parentPort.postMessage({ success: false, error: error.message });
  });
