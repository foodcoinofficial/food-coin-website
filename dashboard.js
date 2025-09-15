// --- CONFIGURATION ---
// We will fill these in after the coin is launched.
const CONFIG = {
    // The main trading pair address for your token (e.g., FC/SOL pair on Raydium)
    pairAddress: 'YOUR_TOKEN_PAIR_ADDRESS_HERE', 

    // The mint address for your Food Coin (FC) token
    tokenMintAddress: 'YOUR_TOKEN_MINT_ADDRESS_HERE',
    
    // The public address of your Charity Wallet
    charityWalletAddress: 'YOUR_CHARITY_WALLET_ADDRESS_HERE',

    // This points to our secure API route. DO NOT CHANGE.
    solanaRpcUrl: '/api/rpc-proxy' 
};
// --------------------

const updateTokenStats = async () => {
    // We can only fetch stats if the pairAddress is set
    if (CONFIG.pairAddress === 'YOUR_TOKEN_PAIR_ADDRESS_HERE') {
        document.getElementById('market-cap').textContent = 'Not Launched';
        return;
    }

    try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${CONFIG.pairAddress}`);
        const data = await response.json();
        
        if (data.pair) {
            const marketCap = data.pair.fdv; // fdv is Fully Diluted Valuation, often used for Market Cap
            document.getElementById('market-cap').textContent = `$${Math.round(marketCap).toLocaleString()}`;
            document.getElementById('goal-progress').textContent = `$${Math.round(marketCap).toLocaleString()}`;
        } else {
            document.getElementById('market-cap').textContent = 'N/A';
        }
    } catch (error) {
        console.error('Error fetching from DexScreener:', error);
        document.getElementById('market-cap').textContent = 'Error';
    }
};

const updateCharityWalletBalance = async () => {
    // We can only fetch balance if the addresses are set
    if (CONFIG.charityWalletAddress === 'YOUR_CHARITY_WALLET_ADDRESS_HERE') {
        document.getElementById('charity-balance').textContent = 'Not Launched';
        return;
    }

    try {
        const response = await fetch(CONFIG.solanaRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountsByOwner',
                params: [
                    CONFIG.charityWalletAddress,
                    { mint: CONFIG.tokenMintAddress },
                    { encoding: 'jsonParsed' }
                ]
            })
        });
        const data = await response.json();
        
        if (data.result?.value[0]) {
            const balance = data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            document.getElementById('charity-balance').textContent = Math.floor(balance).toLocaleString();
        } else {
            document.getElementById('charity-balance').textContent = '0';
        }
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        document.getElementById('charity-balance').textContent = 'Error';
    }
};

const updateTimestamp = () => {
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
};

const fetchAllData = () => {
    updateTokenStats();
    updateCharityWalletBalance();
    updateTimestamp();
};

// Initial load
document.addEventListener('DOMContentLoaded', fetchAllData);

// Refresh every 30 seconds
setInterval(fetchAllData, 30000);