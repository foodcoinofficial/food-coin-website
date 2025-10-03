// File: /api/rpc-proxy.js
// RESTORE TO THIS ORIGINAL VERSION

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Your original file used HELIUS_RPC_URL, let's stick to that for clarity.
    const heliusRpcUrl = process.env.HELIUS_RPC_URL;

    if (!heliusRpcUrl) {
        return response.status(500).json({ error: 'RPC URL not configured on the server.' });
    }

    try {
        const heliusResponse = await fetch(heliusRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.body),
        });

        const data = await heliusResponse.json();
        response.status(heliusResponse.status).json(data);

    } catch (error) {
        console.error('RPC Proxy Error:', error);
        response.status(500).json({ error: 'An internal server error occurred.' });
    }
}
