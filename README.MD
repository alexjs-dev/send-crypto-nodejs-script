# Crypto Transaction Automation

This project automates the process of creating wallets, sending tokens (e.g., USDT), and handling gas fees on the Polygon (Matic) blockchain. It supports both mainnet and testnet environments. The project uses Node.js, the ethers.js library, and worker threads for parallel or sequential processing of multiple wallets.

## Prerequisites

Before running the scripts, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [Infura](https://infura.io/) account for RPC endpoints

## Getting Started

1. **Clone the repository**:

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure your settings**:

   Edit the `settings.js` file to configure your own settings:

   ```javascript
   const INFURA_KEY = "your-infura-api-key"; // register on infura.io to get your api key
   const parentPrivateKey = "your-parent-wallet-private-key";
   const numberOfWallets = 40; // Number of child wallets to create
   const destinationAddress = "your-destination-wallet";
   const rpcUrl = "https://polygon-mainnet.infura.io/v3/" + INFURA_KEY;
   const usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT contract address on Polygon
   const amountToSendUSDT = "1"; // Amount of USDT to send per transaction
   const gasFeeMATIC = "0.1"; // Amount of MATIC to send for gas fees
   const PARALLEL_PROCESSING = false; // Set to true for parallel processing, false for sequential
   ```

   - **INFURA_KEY**: Your Infura project API key.
   - **parentPrivateKey**: The private key of your parent wallet (the wallet holding the funds).
   - **numberOfWallets**: Number of child wallets to create and use.
   - **destinationAddress**: The wallet address to which USDT will be sent.
   - **rpcUrl**: The RPC endpoint for the Polygon network, using Infura.
   - **usdtAddress**: The USDT contract address on the Polygon network.
   - **amountToSendUSDT**: Amount of USDT to send from each child wallet.
   - **gasFeeMATIC**: Amount of MATIC sent to child wallets to cover gas fees.
   - **PARALLEL_PROCESSING**: Enable parallel processing of transactions (set to `true` for parallel, `false` for sequential).

## Available Scripts

You can run the following scripts via `npm run`:

This will send tokens using the mainnet environment, based on your settings.

### 1. Check wallet balances:

```bash
npm run check-balance
```

This script checks the balance of the wallets (both MATIC and USDT) and prints the results.

### 2. Send tokens with your settings:

```bash
npm run send
```

This will send tokens according to the default configuration in the `settings.js` file.

## Notes

- **MATIC Gas Fees**: Ensure that the parent wallet has enough MATIC to cover the gas fees for each transaction.
- **USDT Balance**: Ensure that the parent wallet has enough USDT for the number of transactions you intend to process.
- **Parallel Processing**: If `PARALLEL_PROCESSING` is set to `true`, wallets will be processed in parallel, I personally couldn't get this working because transactions would keep getting dropped.

## License

This project is licensed under the MIT License.
