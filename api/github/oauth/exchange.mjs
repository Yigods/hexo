const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export async function POST(request) {
  const secret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const pinnedClientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!secret) {
    return json(
      {
        error: "server_misconfigured",
        error_description: "Missing GITHUB_OAUTH_CLIENT_SECRET on Vercel.",
      },
      500,
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(
      {
        error: "invalid_request",
        error_description: "Request body must be valid JSON.",
      },
      400,
    );
  }

  const clientId = payload?.clientId?.trim?.() ?? "";
  const code = payload?.code?.trim?.() ?? "";
  const codeVerifier = payload?.codeVerifier?.trim?.() ?? "";
  const redirectUri = payload?.redirectUri?.trim?.() ?? "";

  if (!clientId || !code || !codeVerifier || !redirectUri) {
    return json(
      {
        error: "invalid_request",
        error_description: "clientId, code, codeVerifier and redirectUri are required.",
      },
      400,
    );
  }

  if (pinnedClientId && pinnedClientId !== clientId) {
    return json(
      {
        error: "invalid_client",
        error_description: "Client ID does not match the server configuration.",
      },
      400,
    );
  }

  const upstream = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  const text = await upstream.text();
  let upstreamBody;
  try {
    upstreamBody = JSON.parse(text);
  } catch {
    upstreamBody = {
      error: "github_oauth_exchange_failed",
      error_description: text || "GitHub OAuth exchange returned a non-JSON payload.",
    };
  }

  return json(upstreamBody, upstream.ok ? 200 : upstream.status);
}
