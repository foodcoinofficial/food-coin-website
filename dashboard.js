// Food Coin ($FC) Live Dashboard Script

// ========== CONFIGURATION START ==========
// This section now contains your live addresses.
const CONFIG = {
    // Your RPC endpoint for fetching wallet balances (using the Vercel proxy)
    heliusApiUrl: '/api/rpc-proxy',

    // Your new, live token and pair addresses
    tokenMintAddress: '8pbJTN5uh9nD47vJkjpRnyvdszAe245RSh2XVz2Xpump',
    pairAddress: 'DbwtBT43pP3NVDktfvuY1rnQiBofZMEHsmskcTqYStVa',

    // Your project's core wallet addresses
    charityWalletAddress: '2pWyMq4eCswkTPyATfd27wJoYv1dVyAmEYDHdnycrGkq',
    stablecoinWalletAddress: 'F9HVcBrGY5WLDWWhEDVMB1r1NPfYSPiMF3rBwV6ysYsG',
    burnCollectorAddress: 'GoMpswts8ZEShZyCLd8Y93nsFgwS7QqgSd6au27qQyma',

    // The token address for USDC, used to get the Funding Wallet balance
    usdcMintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
};
// ========== CONFIGURATION END ==========


// --- Main Function to Update Dashboard ---
async function updateDashboard() {
    try {
        // Fetch all data in parallel
        const [walletData, dexData] = await Promise.all([
            fetchWalletBalances(),
            fetchDexScreenerData()
        ]);

        // Update UI with wallet data
        if (walletData) {
            updateWalletUI(walletData);
        }

        // Update UI with market data
        if (dexData) {
            updateMarketUI(dexData);
            updatePriceChart(dexData.priceHistory);
        }
        
        // Update the "last updated" timestamp
        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

    } catch (error) {
        console.error("Error updating dashboard:", error);
    }
}


// --- Data Fetching Functions ---

async function fetchWalletBalances() {
    try {
        const response = await fetch(CONFIG.heliusApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                charityWallet: CONFIG.charityWalletAddress,
                stablecoinWallet: CONFIG.stablecoinWalletAddress,
                burnWallet: CONFIG.burnCollectorAddress,
                fcMint: CONFIG.tokenMintAddress,
                usdcMint: CONFIG.usdcMintAddress
            })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching wallet balances:', error);
        return null;
    }
}

async function fetchDexScreenerData() {
    try {
        const url = `https://api.dexscreener.com/latest/dex/pairs/solana/${CONFIG.pairAddress}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch from DexScreener');
        const data = await response.json();
        
        const pair = data.pairs[0];
        if (!pair) return null;

        return {
            priceUsd: parseFloat(pair.priceUsd),
            liquidity: parseFloat(pair.liquidity.usd),
            volume24h: parseFloat(pair.volume.h24),
            marketCap: parseFloat(pair.fdv),
            priceHistory: { // For the chart
                m5: pair.priceChange.m5,
                h1: pair.priceChange.h1,
                h6: pair.priceChange.h6,
                h24: pair.priceChange.h24
            }
        };
    } catch (error) {
        console.error('Error fetching DexScreener data:', error);
        return null;
    }
}


// --- UI Update Functions ---

function updateWalletUI(data) {
    const { charityBalance, stablecoinBalance, burnBalance } = data;
    
    const charityWalletUsdEl = document.getElementById('charity-wallet-usd');
    const usdtWithdrawnEl = document.getElementById('usdt-withdrawn');
    const mealsFundedEl = document.getElementById('meals-funded');
    const tokensBurnedEl = document.getElementById('tokens-burned');

    // Assuming price is available globally or passed in
    const price = window.currentPrice || 0;
    const charityValue = charityBalance * price;

    charityWalletUsdEl.textContent = `$${charityValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    usdtWithdrawnEl.textContent = `${stablecoinBalance.toLocaleString()} USDC`;
    mealsFundedEl.textContent = (stablecoinBalance * 0.5).toLocaleString(); // Assuming $2 per meal -> 0.5 meals per USDC
    tokensBurnedEl.textContent = `${burnBalance.toLocaleString()} $FC`;
    
    // Update wallet links
    document.getElementById('charity-wallet-link').href = `https://solscan.io/account/${CONFIG.charityWalletAddress}`;
    document.getElementById('usdt-wallet-link').href = `https://solscan.io/account/${CONFIG.stablecoinWalletAddress}`;
    document.getElementById('burn-wallet-link').href = `https://solscan.io/account/${CONFIG.burnCollectorAddress}`;
}

function updateMarketUI(data) {
    window.currentPrice = data.priceUsd; // Store price for wallet calculations
    // Further UI updates for price, liquidity etc. can be added here
}


// --- Charting Function ---
let priceChart = null;
function updatePriceChart(history) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const labels = ['24h ago', '6h ago', '1h ago', '5m ago', 'Current'];
    const price = window.currentPrice || 0;

    // Calculate historical prices from percentage changes
    const price24h = price / (1 + history.h24 / 100);
    const price6h = price / (1 + history.h6 / 100);
    const price1h = price / (1 + history.h1 / 100);
    const price5m = price / (1 + history.m5 / 100);

    const dataPoints = [price24h, price6h, price1h, price5m, price];
    
    if (priceChart) {
        priceChart.data.datasets[0].data = dataPoints;
        priceChart.update();
    } else {
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '$FC Price (USD)',
                    data: dataPoints,
                    borderColor: '#00FFA3',
                    backgroundColor: 'rgba(0, 255, 163, 0.1)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { ticks: { color: 'white' } },
                    x: { ticks: { color: 'white' } }
                },
                plugins: { legend: { labels: { color: 'white' } } }
            }
        });
    }
}
// Placeholder for the tokenomics chart
const tokenomicsCtx = document.getElementById('tokenomicsChart').getContext('2d');
new Chart(tokenomicsCtx, {
    type: 'doughnut',
    data: {
        labels: ['Public Launch', 'The Vault'],
        datasets: [{
            data: [85, 15],
            backgroundColor: ['#00FFA3', '#4E4E6A'],
            borderColor: '#111119',
            borderWidth: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    }
});


// --- Initial Load and Interval ---
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard(); // Initial call
    setInterval(updateDashboard, 30000); // Update every 30 seconds
});
