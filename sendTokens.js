const { Worker } = require("worker_threads");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

const {
  numberOfWallets,
  destinationAddress,
  rpcUrl,
  PARALLEL_PROCESSING,
} = require("./settings");

const walletsDir = path.join(process.cwd(), "wallets");

if (!fs.existsSync(walletsDir)) {
  fs.mkdirSync(walletsDir);
}

const createWallets = (numberOfWallets) => {
  console.log(`Creating ${numberOfWallets} wallets...`);
  const wallets = Array.from({ length: numberOfWallets }, (_, i) => {
    const wallet = ethers.Wallet.createRandom();
    const walletFilePath = path.join(walletsDir, `${wallet.address}.json`);

    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };

    fs.writeFileSync(walletFilePath, JSON.stringify(walletData, null, 2));
    console.log(`${wallet.address} - New wallet created and saved`);

    return walletData;
  });
  return wallets;
};

const runWorker = (walletData, index) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "./worker.js"), {
      workerData: {
        walletData,
        workerIndex: index,
      },
    });

    worker.on("message", (result) => {
      result.success ? resolve() : reject(new Error(result.error));
    });

    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });

const processParallel = async (wallets) => {
  const promises = wallets.map(runWorker);
  try {
    await Promise.all(promises);
    console.log(`Successfully processed ${numberOfWallets} wallets`);
  } catch (error) {
    console.error(`Error processing wallets: ${error.message}`);
  }
};

const processSequential = async (wallets) => {
  for (const [index, wallet] of wallets.entries()) {
    try {
      await runWorker(wallet, index);
    } catch (error) {
      console.error(
        `Error processing wallet ${wallet.address}: ${error.message}`
      );
    }
  }
};

const main = async () => {
  const startTime = Date.now();
  console.log(
    `Sending ${numberOfWallets} transactions from ${rpcUrl} to ${destinationAddress}`
  );

  try {
    const wallets = createWallets(numberOfWallets);
    PARALLEL_PROCESSING
      ? await processParallel(wallets)
      : await processSequential(wallets);

    console.log(`Time taken: ${(Date.now() - startTime) / 1000} seconds`);
  } catch (error) {
    console.error(`Error processing wallets: ${error.message}`);
  }
};

main();
