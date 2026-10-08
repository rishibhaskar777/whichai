interface CspOptions {
  nonce: string;
  isDevelopment: boolean;
}

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/*
 * style-src has no nonce in production: the app ships CSS Modules as
 * same-origin stylesheets and never uses style attributes or <style> tags.
 * The dev server injects <style> tags for hot reload, hence the dev exception.
 */
export function buildCsp({ nonce, isDevelopment }: CspOptions): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  const styleSrc = ["'self'"];
  const connectSrc = ["'self'"];

  if (isDevelopment) {
    scriptSrc.push("'unsafe-eval'");
    styleSrc.push("'unsafe-inline'");
    connectSrc.push("ws:", "wss:");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (!isDevelopment) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
