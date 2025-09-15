// --- CONFIGURATION ---
const CONFIG = {
    pairAddress: 'YOUR_TOKEN_PAIR_ADDRESS_HERE', 
    tokenMintAddress: 'YOUR_TOKEN_MINT_ADDRESS_HERE',
    charityWalletAddress: 'YOUR_CHARITY_WALLET_ADDRESS_HERE',
    
    // Create a NEW, separate wallet for receiving USDC and put its address here.
    stablecoinWalletAddress: 'YOUR_USDC_WALLET_ADDRESS_HERE',
    
    // This is the wallet address for the USDC token itself on Solana.
    usdcMintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',

    solanaRpcUrl: '/api/rpc-proxy',
    
    // ** MANUAL UPDATE AREA **
    // After each food run, add the cost here. This is the total USD spent to date.
    totalDeployedForFood: 0, 

    // Set the goal for the next food run in USD.
    nextFoodRunGoal: 500 
};
// --------------------

// --- GLOBAL STATE ---
let tokenPrice = 0; // We'll store the token price here to use in multiple functions

// --- API FUNCTIONS ---

const updateTokenStats = async () => {
    if (CONFIG.pairAddress === 'YOUR_TOKEN_PAIR_ADDRESS_HERE') {
        document.getElementById('total-raised-usd').textContent = 'Not Launched';
        return;
    }
    try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${CONFIG.pairAddress}`);
        const data = await response.json();
        
        if (data.pair) {
            tokenPrice = parseFloat(data.pair.priceUsd);
        }
    } catch (error) {
        console.error('Error fetching from DexScreener:', error);
    }
};

const updateCharityWalletBalance = async () => {
    if (CONFIG.charityWalletAddress === 'YOUR_CHARITY_WALLET_ADDRESS_HERE') return;
    try {
        const response = await fetch(CONFIG.solanaRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        // Calculate and display the total raised value
        const totalRaisedValue = balance * tokenPrice;
        document.getElementById('total-raised-usd').textContent = `$${Math.round(totalRaisedValue).toLocaleString()}`;
        
    } catch (error) {
        console.error('Error fetching charity wallet balance:', error);
    }
};

const updateStablecoinBalance = async () => {
    if (CONFIG.stablecoinWalletAddress === 'YOUR_USDC_WALLET_ADDRESS_HERE') {
        document.getElementById('usdc-balance').textContent = 'Not Launched';
        return;
    }
    try {
        const response = await fetch(CONFIG.solanaRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        document.getElementById('usdc-balance').textContent = `$${Math.round(usdcBalance).toLocaleString()}`;
        
        // Update the progress bar
        const progress = Math.min((usdcBalance / CONFIG.nextFoodRunGoal) * 100, 100);
        document.getElementById('next-goal-progress').style.width = `${progress}%`;
        document.getElementById('next-goal-text').textContent = `$${Math.round(usdcBalance).toLocaleString()} / $${CONFIG.nextFoodRunGoal.toLocaleString()} Raised`;

    } catch (error) {
        console.error('Error fetching stablecoin balance:', error);
    }
};

const updateManualStats = () => {
    document.getElementById('deployed-for-food').textContent = `$${CONFIG.totalDeployedForFood.toLocaleString()}`;
};

const updateTimestamp = () => {
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
};

const fetchAllData = async () => {
    await updateTokenStats(); // Wait for this first to get the price
    // Now run the rest in parallel
    Promise.all([
        updateCharityWalletBalance(),
        updateStablecoinBalance(),
        updateManualStats()
    ]);
    updateTimestamp();
};

document.addEventListener('DOMContentLoaded', fetchAllData);
setInterval(fetchAllData, 30000);
