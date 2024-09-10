// Configuration
const INFURA_KEY = "XXX"; // Register at infura.io to get one
const parentPrivateKey = "your-parent-wallet-private-key"; // Parent wallet private key
const numberOfWallets = 40;
const destinationAddress = "your-destination-address"; // Destination address for USDT
const rpcUrl = "https://polygon-mainnet.infura.io/v3/" + INFURA_KEY;
const usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon (MATIC) change if you are using a different network
const amountToSendUSDT = "1";
const gasFeeMATIC = "0.1"; // 1 matic = .4 USD, 0.1 matic = 0.04 USD. for 100 = 0.4 USD
const PARALLEL_PROCESSING = false;

module.exports = {
  parentPrivateKey,
  numberOfWallets,
  destinationAddress,
  rpcUrl,
  usdtAddress,
  amountToSendUSDT,
  gasFeeMATIC,
  PARALLEL_PROCESSING,
};
