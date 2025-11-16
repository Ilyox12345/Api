export default {
  async fetch(request) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS")
      return new Response(null, { headers: cors });

    const url = new URL(request.url);

    // ---------------------------
    // VARIABLES EN DUR (pas d'env)
    // ---------------------------
    const CLIENT_ID = "1439239509521989745";
    const CLIENT_SECRET = "urnCz0CyNE_66VOckTI16casJJcxZNyi";
    const REDIRECT_URI = "https://bumpx.pages.dev/auth.html";
    const SECRET_KEY = "BumpX@@@";


    // =======================================
    //        OAUTH CALLBACK DISCORD
    // =======================================
    if (url.pathname === "/auth/callback") {

      const code = url.searchParams.get("code");
      if (!code)
        return new Response("Missing OAuth2 code", { status: 400 });

      // Exchange code → access token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token)
        return new Response("OAuth failed: " + JSON.stringify(tokenData), { status: 500 });

      // Fetch user
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      const user = await userResponse.json();

      const session = btoa(JSON.stringify({
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }));

return Response.redirect(`https://bumpx.pages.dev/auth.html?session=${session}`, 302);
    }



    // =======================================
    //              GET /stats
    // =======================================
    if (request.method === "GET" && url.pathname === "/stats") {

      const data = await BumpX_STATS.get("bot_stats", { type: "json" });

      return new Response(
        JSON.stringify(data || { servers: 0, users: 0, bumps: 0 }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }



    // =======================================
    //             POST /update
    // =======================================
    if (request.method === "POST" && url.pathname === "/update") {

      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${SECRET_KEY}`)
        return new Response("Unauthorized", { status: 401 });

      try {
        const body = await request.json();
        await BumpX_STATS.put("bot_stats", JSON.stringify(body));

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...cors, "Content-Type": "application/json" } }
        );

      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
