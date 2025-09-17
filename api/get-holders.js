// This is a Vercel Serverless Function: /api/get-holders.js
// It securely fetches and returns the top 5 token holders.

export default async function handler(request, response) {
    const heliusRpcUrl = process.env.HELIUS_RPC_URL;
    // Get the token mint address from the request query, e.g., /api/get-holders?mint=...
    const { mint } = request.query;

    if (!heliusRpcUrl) {
        return response.status(500).json({ error: 'RPC URL not configured on the server.' });
    }
    if (!mint) {
        return response.status(400).json({ error: 'Token mint address is required.' });
    }

    try {
        // This is a standard Solana RPC call to get all accounts for a given token
        const rpcResponse = await fetch(heliusRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenLargestAccounts',
                params: [mint],
            }),
        });

        const data = await rpcResponse.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        // We get total supply to calculate percentage
        const supplyResponse = await fetch(heliusRpcUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenSupply',
                params: [mint],
            }),
        });
        const supplyData = await supplyResponse.json();
        const totalSupply = supplyData.result.value.uiAmount;

        // Process the data to get the top 5
        const topHolders = data.result.value.slice(0, 5).map((account, index) => {
            const balance = account.uiAmount;
            const percentage = (balance / totalSupply * 100).toFixed(2);
            // Truncate address for display
            const address = account.address;
            const truncatedAddress = `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;

            return {
                rank: index + 1,
                address: truncatedAddress,
                percentage: `${percentage}%`
            };
        });

        // Send the clean data back to the front-end
        // Cache the response for 60 seconds to avoid hitting rate limits
        response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        return response.status(200).json(topHolders);

    } catch (error) {
        console.error('Error in get-holders API:', error);
        return response.status(500).json({ error: 'Failed to fetch holder data.' });
    }
}