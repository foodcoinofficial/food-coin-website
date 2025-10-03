// File: /api/rpc-proxy.js
// FINAL WORKING CODE

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
    if (!HELIUS_API_KEY) {
        console.error("Proxy Error: HELIUS_API_KEY environment variable not set.");
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

        const data = await response.json();

        if (data.error) {
            console.error("Helius API Error:", data.error);
            return res.status(500).json({ error: 'Helius API returned an error.', details: data.error.message });
        }
        
        if (!data.result) {
            console.error("Proxy Error: 'result' field not found in Helius response.");
            return res.status(500).json({ error: "Invalid response structure from Helius." });
        }

        const balances = data.result;

        res.status(200).json({
            charityBalance: balances[charityWallet]?.[fcMint] || 0,
            stablecoinBalance: balances[stablecoinWallet]?.[usdcMint] || 0,
            burnBalance: balances[burnWallet]?.[fcMint] || 0
        });

    } catch (error) {
        console.error('Proxy Catch Block Error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet balances' });
    }
}
