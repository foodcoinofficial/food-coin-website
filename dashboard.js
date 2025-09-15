// --- CONFIGURATION ---
const CONFIG = {
    // After launch, find the main FC/SOL pair address on DexScreener
    pairAddress: 'YOUR_TOKEN_PAIR_ADDRESS_HERE', 
    
    // The address of the Food Coin (FC) token itself
    tokenMintAddress: 'YOUR_TOKEN_MINT_ADDRESS_HERE',
    
    // The public address of the main charity wallet holding FC
    charityWalletAddress: 'YOUR_CHARITY_WALLET_ADDRESS_HERE',
    
    // A NEW, separate wallet for receiving USDC after selling FC
    stablecoinWalletAddress: 'YOUR_USDC_WALLET_ADDRESS_HERE',
    
    // The official mint address for USDC on Solana
    usdcMintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',

    // This points to our secure API route. DO NOT CHANGE.
    solanaRpcUrl: '/api/rpc-proxy',
    
    // ** MANUAL UPDATE AREA **
    // After completing a milestone from the schedule, update this number.
    // e.g., after the first food run, change this to 50. After the second, 150.
    totalMealsFunded: 0 
};
// --------------------

// --- GLOBAL STATE ---
let tokenPrice = 0;

// --- API FUNCTIONS ---

const updateTokenPrice = async () => {
    if (CONFIG.pairAddress === 'YOUR_TOKEN_PAIR_ADDRESS_HERE') {
        document.getElementById('charity-wallet-usd').textContent = 'Not Launched';
        return false;
    }
    try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${CONFIG.pairAddress}`);
        const data = await response.json();
        if (data.pair) {
            tokenPrice = parseFloat(data.pair.priceUsd);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error fetching token price:', error);
        return false;
    }
};

const updateCharityWalletValue = async () => {
    if (!tokenPrice) return; // Don't run if we don't have a price
    try {
        const response = await fetch(CONFIG.solanaRpcUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
                params: [ CONFIG.charityWalletAddress, { mint: CONFIG.tokenMintAddress }, { encoding: 'jsonParsed' } ]
            })
        });
        const data = await response.json();
        let balance = 0;
        if (data.result?.value[0]) {
            balance = data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        }
        const totalValue = balance * tokenPrice;
        document.getElementById('charity-wallet-usd').textContent = `$${Math.round(totalValue).toLocaleString()}`;
    } catch (error) {
        console.error('Error fetching charity wallet balance:', error);
    }
};

const updateUsdtWithdrawn = async () => {
    if (CONFIG.stablecoinWalletAddress === 'YOUR_USDC_WALLET_ADDRESS_HERE') {
        document.getElementById('usdt-withdrawn').textContent = 'Not Launched';
        return;
    }
    try {
        const response = await fetch(CONFIG.solanaRpcUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
                params: [ CONFIG.stablecoinWalletAddress, { mint: CONFIG.usdcMintAddress }, { encoding: 'jsonParsed' } ]
            })
        });
        const data = await response.json();
        let usdcBalance = 0;
        if (data.result?.value[0]) {
            usdcBalance = data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        }
        document.getElementById('usdt-withdrawn').textContent = `$${Math.round(usdcBalance).toLocaleString()}`;
    } catch (error) {
        console.error('Error fetching stablecoin balance:', error);
    }
};

const updateTokenHolders = async () => {
    if (CONFIG.tokenMintAddress === 'YOUR_TOKEN_MINT_ADDRESS_HERE') {
        document.getElementById('token-holders').textContent = 'Not Launched';
        return;
    }
    try {
        const response = await fetch(CONFIG.solanaRpcUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'getTokenSupply',
                params: [ CONFIG.tokenMintAddress ]
            })
        });
        const data = await response.json();
        // NOTE: getTokenSupply provides total supply, not holder count. A direct holder count is a more complex call.
        // For a simpler, more available metric, let's use a placeholder or link to Solscan for now.
        // A true holder count requires a more advanced Helius API call. Let's start with a placeholder.
        // TODO: Implement advanced holder count API call.
        document.getElementById('token-holders').textContent = 'See Solscan'; // Placeholder
    } catch (error) {
        console.error('Error fetching token holders:', error);
    }
};


const updateManualStats = () => {
    document.getElementById('meals-funded').textContent = CONFIG.totalMealsFunded.toLocaleString();
};

const updateTimestamp = () => {
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
};

const fetchAllData = async () => {
    const priceAvailable = await updateTokenPrice();
    if (priceAvailable) {
        updateCharityWalletValue(); // This depends on the price
    }
    // These can run in parallel
    updateUsdtWithdrawn();
    updateTokenHolders();
    updateManualStats();
    updateTimestamp();
};

document.addEventListener('DOMContentLoaded', fetchAllData);
setInterval(fetchAllData, 30000);
