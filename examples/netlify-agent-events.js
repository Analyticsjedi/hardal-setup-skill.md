// netlify/edge-functions/hardal-agent-events.js
// AI Visibility forwarding on Netlify (from Hardal's AI Visibility Installation Examples).
// Replace the collection URL and IDs, and set config.path to the public page routes.
const endpoint = "https://analytics.example.com/agent-events";
const tenantId = "11111111-1111-4111-8111-111111111111";
const sourceId = "22222222-2222-4222-8222-222222222222";

export const config = {
  path: ["/", "/pricing", "/blog/*"],
  method: ["GET", "HEAD"],
};

export default function captureAgentRequest(request, context) {
  const userAgent = request.headers.get("user-agent");
  if (!context.ip || !userAgent) return;

  const body = {
    path: new URL(request.url).pathname,
    ip: context.ip,
    userAgent,
    eventTime: new Date().toISOString(),
    sourceId,
  };

  context.waitUntil(
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "tenant-id": tenantId },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    }).then((response) => {
      if (!response.ok) console.error("Hardal agent forwarding failed", response.status);
    }).catch((error) => console.error("Hardal agent forwarding failed", error.message))
  );
}
