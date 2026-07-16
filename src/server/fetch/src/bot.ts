export const BOT_METHOD_NOT_ALLOWED_ERROR = 'Method not allowed';

const handler = async (request: Request, env: Env) => {
  if (request.method !== 'GET' && request.method !== 'HEAD')
    return new Response(BOT_METHOD_NOT_ALLOWED_ERROR, { status: 405, headers: { Allow: 'GET, HEAD' } });

  const { kty, crv, x, d } = JSON.parse(env.CLOUDFLARE_WEB_BOT_AUTH_JWK) as JsonWebKey;
  const now = Math.floor(Date.now() / 1000);

  const params =
    `("@authority";req)` +
    `;alg="ed25519"` +
    `;keyid="${await thumbprint({ kty, crv, x })}"` +
    `;nonce="${toBase64(crypto.getRandomValues(new Uint8Array(64)))}"` +
    `;tag="http-message-signatures-directory"` +
    `;created=${now}` +
    `;expires=${now + 300}`;

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'Ed25519' },
      await crypto.subtle.importKey('jwk', { kty, crv, x, d }, { name: 'Ed25519' }, false, ['sign']),
      new TextEncoder().encode(`"@authority";req: ${new URL(request.url).host}\n"@signature-params": ${params}`),
    ),
  );

  return new Response(request.method === 'HEAD' ? null : JSON.stringify({ keys: [{ kty, crv, x }] }), {
    headers: {
      'Content-Type': 'application/http-message-signatures-directory+json',
      'Signature-Input': `sig1=${params}`,
      Signature: `sig1=:${toBase64(signature)}:`,
      'Cache-Control': 'no-store',
    },
  });
};

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

async function thumbprint(jwk: JsonWebKey) {
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return toBase64(new Uint8Array(digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default handler;
