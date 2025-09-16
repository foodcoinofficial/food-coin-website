// --- CONFIGURATION ---
const CONFIG = {
    pairAddress: 'YOUR_TOKEN_PAIR_ADDRESS_HERE', 
    tokenMintAddress: 'YOUR_TOKEN_MINT_ADDRESS_HERE',
    charityWalletAddress: '2pWyMq4eCswkTPyATfd27wJoYv1dVyAmEYDHdnycrGkq',
    stablecoinWalletAddress: 'F9HVcBrGY5WLDWWhEDVMB1r1NPfYSPiMF3rBwV6ysYsG',
    burnCollectorAddress: 'GoMpswts8ZEShZyCLd8Y93nsFgwS7QqgSd6au27qQyma',
    usdcMintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    solanaRpcUrl: '/api/rpc-proxy',
    
    // ** MANUAL UPDATE AREA **
    totalMealsFunded: 0,
    
    // Links for your buttons in the navbar and hero
    pumpFunLink: 'YOUR_PUMP_FUN_LINK', // Fill this in!
    twitterLink: 'https://x.com/foodcoinsolana' // Fill this in!
};
// --------------------

// --- GLOBAL STATE ---
let tokenPrice = 0;

// --- API FETCHING FUNCTIONS ---
const updateMarketStats = async () => {
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
    if (!tokenPrice) return;
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
        document.getElementById('usdt-withdrawn').textContent = 'Awaiting Milestone';
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

const updateBurnWalletBalance = async () => {
    if (CONFIG.burnCollectorAddress === 'YOUR_BURN_COLLECTOR_WALLET_ADDRESS_HERE') {
        document.getElementById('tokens-burned').textContent = 'Not Active';
        return;
    }
    try {
        const response = await fetch(CONFIG.solanaRpcUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
                params: [ CONFIG.burnCollectorAddress, { mint: CONFIG.tokenMintAddress }, { encoding: 'jsonParsed' } ]
            })
        });
        const data = await response.json();
        let balance = 0;
        if (data.result?.value[0]) {
            balance = data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        }
        document.getElementById('tokens-burned').textContent = Math.floor(balance).toLocaleString();
    } catch (error) {
        console.error('Error fetching burn wallet balance:', error);
    }
};

// --- STATIC & MANUAL UPDATE FUNCTIONS ---
const updateManualStats = () => {
    document.getElementById('meals-funded').textContent = CONFIG.totalMealsFunded.toLocaleString();
};

const updateTimestamp = () => {
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
};

const setupLinks = () => {
    // Dashboard Wallet Links
    if (CONFIG.charityWalletAddress !== 'YOUR_CHARITY_WALLET_ADDRESS_HERE') {
        document.getElementById('charity-wallet-link').href = `https://solscan.io/account/${CONFIG.charityWalletAddress}`;
    }
    if (CONFIG.stablecoinWalletAddress !== 'YOUR_USDC_WALLET_ADDRESS_HERE') {
        document.getElementById('usdt-wallet-link').href = `https://solscan.io/account/${CONFIG.stablecoinWalletAddress}`;
    }
    if (CONFIG.burnCollectorAddress !== 'YOUR_BURN_COLLECTOR_WALLET_ADDRESS_HERE') {
        document.getElementById('burn-wallet-link').href = `https://solscan.io/account/${CONFIG.burnCollectorAddress}`;
    }

    // Navbar and Hero Button Links
    const pumpFunButtons = document.querySelectorAll('a[href="YOUR_PUMP_FUN_LINK"]');
    pumpFunButtons.forEach(btn => {
        if (CONFIG.pumpFunLink !== 'YOUR_PUMP_FUN_LINK') {
            btn.href = CONFIG.pumpFunLink;
        }
    });

    const twitterButtons = document.querySelectorAll('a[href="https://x.com/foodcoinsolana"]');
    twitterButtons.forEach(btn => {
        if (CONFIG.twitterLink !== 'https://x.com/foodcoinsolana') {
            btn.href = CONFIG.twitterLink;
        }
    });
};

// --- CHART RENDERING FUNCTION ---
const renderTokenomicsChart = () => {
    const ctx = document.getElementById('tokenomicsChart');
    if (ctx) { // Check if the canvas element exists before trying to render
        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Public Launch', 'Charity Wallet'],
                datasets: [{
                    data: [85, 15], // Corresponds to 85% and 15%
                    backgroundColor: ['#FFFFFF', 'hsl(158, 100%, 50%)'],
                    borderColor: ['#1E1E1E'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }
};

// --- MAIN EXECUTION ---
const fetchAllData = async () => {
    const priceAvailable = await updateMarketStats();
    if (priceAvailable) {
        updateCharityWalletValue();
    }
    updateUsdtWithdrawn();
    updateBurnWalletBalance();
    updateManualStats();
    updateTimestamp();
};

document.addEventListener('DOMContentLoaded', () => {
    setupLinks();
    renderTokenomicsChart(); // This should now render correctly
    fetchAllData();
    setInterval(fetchAllData, 30000);
});



