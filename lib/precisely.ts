const BASE_URL = "https://api.cloud.precisely.com";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Get an OAuth2 bearer token using client_credentials grant.
 * Caches the token and refreshes 60s before expiry.
 */
async function getBearerToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const key = process.env.PRECISELY_API_KEY;
  const secret = process.env.PRECISELY_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      "Missing PRECISELY_API_KEY or PRECISELY_API_SECRET environment variables"
    );
  }

  const basicAuth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/auth/v2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=default",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Failed to get Precisely auth token: ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Refresh 60s before expiry (default expiry is 3600s)
  const expiresIn = (data.expires_in || 3600) - 60;
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  return cachedToken!;
}

/**
 * POST to a Precisely API endpoint.
 * Returns parsed JSON on success, or an error object on failure.
 */
export async function preciselyPost(
  path: string,
  body: unknown,
  contentType = "application/json"
): Promise<Record<string, unknown>> {
  const token = await getBearerToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: res.statusText }));
    return { error: true, status: res.status, details: error };
  }

  return res.json();
}

/**
 * POST a GraphQL query to the Precisely Data Graph API.
 */
export async function preciselyGraphQL(
  query: string,
  variables?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const token = await getBearerToken();

  const body: Record<string, unknown> = { query };
  if (variables) body.variables = variables;

  const res = await fetch(`${BASE_URL}/data-graph/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: res.statusText }));
    return { error: true, status: res.status, details: error };
  }

  return res.json();
}

/**
 * GET from a Precisely API endpoint with query parameters.
 * Returns parsed JSON on success, or an error object on failure.
 */
export async function preciselyGet(
  path: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const token = await getBearerToken();

  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: res.statusText }));
    return { error: true, status: res.status, details: error };
  }

  return res.json();
}
