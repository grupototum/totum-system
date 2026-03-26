/**
 * Edge Function: asaas-proxy
 * Proxy seguro para a API do Asaas — resolve CORS e protege a API key
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-asaas-key, x-asaas-env",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Extrair a API key e ambiente do header
    const asaasKey = req.headers.get("x-asaas-key");
    const environment = req.headers.get("x-asaas-env") || "production";

    if (!asaasKey) {
      return new Response(
        JSON.stringify({ error: "API key não fornecida" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = environment === "sandbox"
      ? "https://sandbox.asaas.com/api/v3"
      : "https://api.asaas.com/v3";

    // Extrair o path da URL da requisição
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/asaas-proxy");
    const asaasPath = pathParts[1] || "/";
    const queryString = url.search;

    const targetUrl = `${baseUrl}${asaasPath}${queryString}`;

    // Fazer a requisição para o Asaas
    const body = req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

    const asaasResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "access_token": asaasKey,
        "Content-Type": "application/json",
        "User-Agent": "TotumERP/1.0",
      },
      body,
    });

    const responseData = await asaasResponse.text();

    return new Response(responseData, {
      status: asaasResponse.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro no proxy Asaas:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno no proxy", details: String(error) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
