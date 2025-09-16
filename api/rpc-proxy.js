// This is a Vercel Serverless Function that runs on the backend.
// It securely forwards requests from your website to Helius.

export default async function handler(request, response) {
    // Only allow POST requests, which is what the Solana RPC uses
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Get the secret Helius URL from the Vercel environment variables.
    // This process.env.HELIUS_RPC_URL is NEVER exposed to the public.
    const heliusRpcUrl = process.env.HELIUS_RPC_URL;

    if (!heliusRpcUrl) {
        return response.status(500).json({ error: 'RPC URL not configured on the server.' });
    }

    try {
        // Forward the exact request body from our front-end (dashboard.js) to Helius
        const heliusResponse = await fetch(heliusRpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request.body),
        });

        // Parse the JSON response from Helius
        const data = await heliusResponse.json();

        // Send the Helius response back to our front-end
        response.status(heliusResponse.status).json(data);

    } catch (error) {
        console.error('RPC Proxy Error:', error);
        response.status(500).json({ error: 'An internal server error occurred.' });
    }
}