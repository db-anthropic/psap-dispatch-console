const BASE_URL = "https://api.cloud.precisely.com";

function getAuthHeader(): string {
  const key = process.env.PRECISELY_API_KEY;
  const secret = process.env.PRECISELY_API_SECRET;
  if (!key || !secret) {
    throw new Error(
      "Missing PRECISELY_API_KEY or PRECISELY_API_SECRET environment variables"
    );
  }
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

/**
 * POST to a Precisely API endpoint.
 * Returns parsed JSON on success, or an error object on failure.
 */
export async function preciselyPost(
  path: string,
  body: unknown
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
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
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getAuthHeader(),
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
