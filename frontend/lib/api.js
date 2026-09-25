export async function apiFetch(
  getToken,
  endpoint,
  options = {},
) {
  const token = await getToken();

  if (!token) {
    throw new Error("Authentication required.");
  }

  const headers = new Headers(options.headers || {});

  headers.set(
    "Authorization",
    `Bearer ${token}`,
  );

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  const contentType =
    response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.detail
        ? data.detail
        : "Request failed.";

    throw new Error(message);
  }

  return data;
}