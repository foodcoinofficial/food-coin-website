// File: /api/rpc-proxy.js
// This is the correct version that works with your dashboard.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // This MUST match the name in your Vercel settings
    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
    if (!HELIUS_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { charityWallet, stablecoinWallet, burnWallet, fcMint, usdcMint } = req.body;

    try {
        const response = await fetch(HELIUS_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'food-coin-dashboard',
                method: 'getTokenAccounts',
                params: {
                    wallets: [charityWallet, stablecoinWallet, burnWallet],
                    mint: [fcMint, usdcMint]
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Helius RPC request failed with status ${response.status}`);
        }

        const data = await response.json();
        const balances = data.result;

        res.status(200).json({
            charityBalance: balances[charityWallet][fcMint] || 0,
            stablecoinBalance: balances[stablecoinWallet][usdcMint] || 0,
            burnBalance: balances[burnWallet][fcMint] || 0
        });

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet balances' });
    }
}
