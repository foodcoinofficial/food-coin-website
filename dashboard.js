// Food Coin ($FC) Live Dashboard Script - FINAL WORKING VERSION

const CONFIG = {
    proxyUrl: '/api/rpc-proxy',
    tokenMintAddress: '8pbJTN5uh9nD47vJkjpRnyvdszAe245RSh2XVz2Xpump',
    pairAddress: 'DbwtBT43pP3NVDktfvuY1rnQiBofZMEHsmskcTqYStVa',
    charityWalletAddress: '2pWyMq4eCswkTPyATfd27wJoYv1dVyAmEYDHdnycrGkq',
    stablecoinWalletAddress: 'F9HVcBrGY5WLDWWhEDVMB1r1NPfYSPiMF3rBwV6ysYsG',
    burnCollectorAddress: 'GoMpswts8ZEShZyCLd8Y93nsFgwS7QqgSd6au27qQyma',
    usdcMintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
};

async function updateDashboard() {
    try {
        const [walletData, dexData] = await Promise.all([
            fetchWalletBalances(),
            fetchDexScreenerData()
        ]);
        
        if (dexData) {
            window.currentPrice = dexData.priceUsd;
        }

        if (walletData) {
            updateWalletUI(walletData);
        }

        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error("Error updating dashboard:", error);
    }
}

function parseBalance(accounts, mintAddress) {
    if (!accounts || !accounts.value || accounts.value.length === 0) return 0;
    const account = accounts.value.find(acc => acc.account.data.parsed.info.mint === mintAddress);
    return account ? account.account.data.parsed.info.tokenAmount.uiAmount : 0;
}

async function fetchWalletBalances() {
    try {
        const requestBody = [
            { jsonrpc: '2.0', id: 'charity', method: 'getTokenAccountsByOwner', params: [CONFIG.charityWalletAddress, { mint: CONFIG.tokenMintAddress }, { encoding: 'jsonParsed' }] },
            { jsonrpc: '2.0', id: 'stablecoin', method: 'getTokenAccountsByOwner', params: [CONFIG.stablecoinWalletAddress, { mint: CONFIG.usdcMintAddress }, { encoding: 'jsonParsed' }] },
            { jsonrpc: '2.0', id: 'burn', method: 'getTokenAccountsByOwner', params: [CONFIG.burnCollectorAddress, { mint: CONFIG.tokenMintAddress }, { encoding: 'jsonParsed' }] }
        ];

        const response = await fetch(CONFIG.proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const charityResponse = data.find(r => r.id === 'charity');
        const stablecoinResponse = data.find(r => r.id === 'stablecoin');
        const burnResponse = data.find(r => r.id === 'burn');

        return {
            charityBalance: parseBalance(charityResponse?.result, CONFIG.tokenMintAddress),
            stablecoinBalance: parseBalance(stablecoinResponse?.result, CONFIG.usdcMintAddress),
            burnBalance: parseBalance(burnResponse?.result, CONFIG.tokenMintAddress)
        };
    } catch (error) {
        console.error('Error fetching wallet balances:', error);
        return null;
    }
}

async function fetchDexScreenerData() {
    // This part remains the same, but it will work now
    try {
        const url = `https://api.dexscreener.com/latest/dex/pairs/solana/${CONFIG.pairAddress}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch from DexScreener');
        const data = await response.json();
        const pair = data.pairs?.[0];
        if (!pair) return null;
        return { priceUsd: parseFloat(pair.priceUsd) || 0 };
    } catch (error) {
        console.error('Error fetching DexScreener data:', error);
        return null;
    }
}

function updateWalletUI(data) {
    if (!data) return;
    const price = window.currentPrice || 0;
    const charityValue = data.charityBalance * price;

    document.getElementById('charity-wallet-usd').textContent = `$${charityValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('usdt-withdrawn').textContent = `${(data.stablecoinBalance || 0).toLocaleString()} USDC`;
    document.getElementById('meals-funded').textContent = ((data.stablecoinBalance || 0) * 0.5).toLocaleString();
    document.getElementById('tokens-burned').textContent = `${(data.burnBalance || 0).toLocaleString()} $FC`;

    document.getElementById('charity-wallet-link').href = `https://solscan.io/account/${CONFIG.charityWalletAddress}`;
    document.getElementById('usdt-wallet-link').href = `https://solscan.io/account/${CONFIG.stablecoinWalletAddress}`;
    document.getElementById('burn-wallet-link').href = `https://solscan.io/account/${CONFIG.burnCollectorAddress}`;
}

// Chart code is removed as it's replaced by the DexScreener embed.
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    setInterval(updateDashboard, 30000);
});
