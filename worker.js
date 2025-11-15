export default {
  async fetch(request, env) {

    // --- CORS ---
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // --- Préflight CORS ---
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }


    // =============================
    //          GET /stats
    // =============================
    if (request.method === "GET") {

      const data = await env.STATS.get("bot_stats", { type: "json" });

      return new Response(
        JSON.stringify(
          data || { servers: 0, users: 0, bumps: 0 }
        ),
        {
          headers: {
            ...cors,
            "Content-Type": "application/json"
          }
        }
      );
    }


    // =============================
    //         POST /update
    // =============================
    if (request.method === "POST") {

      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.SECRET_KEY}`) {
        return new Response("Unauthorized", { status: 401, headers: cors });
      }

      try {
        const body = await request.json();
        // body doit être : { servers, users, bumps }

        await env.STATS.put("bot_stats", JSON.stringify(body));

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              ...cors,
              "Content-Type": "application/json"
            }
          }
        );

      } catch (e) {
        return new Response("Invalid JSON", { status: 400, headers: cors });
      }
    }


    // --- Route inconnue ---
    return new Response("Not found", { status: 404, headers: cors });
  }
};
