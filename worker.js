export default {
  async fetch(request, env) {

    // --- CORS ---
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);


    // =====================================================
    //                OAUTH DISCORD CALLBACK
    // =====================================================
    if (url.pathname === "/auth/callback") {

      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing OAuth2 code", { status: 400 });
      }

      // --- Échange du code contre un token Discord ---
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: "1439239509521989745",
          client_secret: env.CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: "https://bumpx.pages.dev/auth.html"
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return new Response("OAuth exchange failed: " + JSON.stringify(tokenData), { status: 500 });
      }

      // --- Récupérer les infos utilisateur ---
      const userRes = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      const user = await userRes.json();

      // --- Créer une session simple (token signé) ---
      const session = btoa(JSON.stringify({
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }));

      // --- Redirection vers le dashboard ---
      return Response.redirect(`https://bumpx.pages.dev/dashboard.html?session=${session}`, 302);
    }


    // =====================================================
    //                     GET /stats
    // =====================================================
    if (request.method === "GET" && url.pathname === "/stats") {

      const data = await env.STATS.get("bot_stats", { type: "json" });

      return new Response(
        JSON.stringify(data || { servers: 0, users: 0, bumps: 0 }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }


    // =====================================================
    //                    POST /update
    // =====================================================
    if (request.method === "POST" && url.pathname === "/update") {

      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.SECRET_KEY}`) {
        return new Response("Unauthorized", { status: 401, headers: cors });
      }

      try {
        const body = await request.json();

        await env.STATS.put("bot_stats", JSON.stringify(body));

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...cors, "Content-Type": "application/json" } }
        );

      } catch (e) {
        return new Response("Invalid JSON", { status: 400, headers: cors });
      }
    }

    return new Response("Not found", { status: 404, headers: cors });
  }
};

