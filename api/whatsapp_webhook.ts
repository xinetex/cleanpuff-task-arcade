export const config = {
  runtime: 'edge', // Use Vercel Edge runtime
};

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "cleanpuff_token_123";
const POD_ID = process.env.LEMMA_POD_ID || "019f7fe5-e9df-7738-a037-115379b245a0";

export default async function handler(req) {
  const url = new URL(req.url);

  // 1. Webhook Verification (GET request from Meta)
  if (req.method === 'GET') {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      // Meta expects the raw challenge string sent back immediately
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response(JSON.stringify({ error: "Verification failed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. Incoming WhatsApp Message (POST request from Meta)
  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    const LEMMA_TOKEN = process.env.LEMMA_TOKEN;
    console.log("WhatsApp webhook event:", JSON.stringify(body, null, 2));

    if (!LEMMA_TOKEN) {
      console.error("Missing LEMMA_TOKEN environment variable in Vercel.");
      // We return 200 so Meta doesn't retry endlessly on our configuration errors
      return new Response(JSON.stringify({ error: "Missing backend configuration" }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const response = await fetch(`https://api.lemma.work/pods/${POD_ID}/functions/whatsapp_webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LEMMA_TOKEN}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      return new Response(JSON.stringify(result), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Failed to forward to Lemma:", error);
      return new Response(JSON.stringify({ error: "Failed to forward webhook" }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { 
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
}
