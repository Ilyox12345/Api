// =========================================
//  API STATS BUMPX - CLOUDFLARE WORKER
// =========================================

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Preflight (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // ========================
    //      GET /stats
    // ========================
    if (request.method === 'GET') {
      let stats = await env.STATS.get("bot_stats", { type: "json" });

      if (!stats) {
        stats = {
          servers: 0,
          users: 0,
          bumps: 0
        };
      }

      return new Response(JSON.stringify(stats), {
        headers: {
          ...cors,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30"
        }
      });
    }

    // ========================
    //   POST /update (protégé)
    // ========================
    if (request.method === 'POST') {
      const auth = request.headers.get("Authorization");
      const secret = env.SECRET_KEY;

      // Auth requise
      if (auth !== `Bearer ${secret}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const body = await request.json();

        if (
          typeof body.servers !== "number" ||
          typeof body.users !== "number" ||
          typeof body.bumps !== "number"
        ) {
          return new Response("Invalid data", { status: 400 });
        }

        await env.STATS.put("bot_stats", JSON.stringify(body));

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response("Error saving stats", { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};
