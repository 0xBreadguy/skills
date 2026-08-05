#!/usr/bin/env node
// check-secure-context.mjs
//
// Decides whether a URL or host is a valid WebAuthn "secure context" for MOSS
// passkey account creation. MOSS onboarding uses WebAuthn/passkeys, which the
// browser only allows in a secure context. Outside one, account creation fails —
// and Chromium reports it misleadingly as
//   "WebAuthn is not supported on sites with TLS certificate errors."
//
// Usage:
//   node check-secure-context.mjs <url-or-host>
//
// Examples:
//   node check-secure-context.mjs http://localhost:5173      -> OK
//   node check-secure-context.mjs http://127.0.0.1:3000      -> OK
//   node check-secure-context.mjs https://yourapp.com        -> WARN (cert trust cannot be checked here)
//   node check-secure-context.mjs http://192.168.1.50:5173   -> INVALID
//   node check-secure-context.mjs https://192.168.1.50:5173  -> WARN (valid only with a trusted cert)
//
// Exit codes: 0 for OK or WARN, 1 for INVALID (or bad input).
//
// No external dependencies.

const raw = process.argv[2];

if (!raw) {
  console.error('INVALID: no URL or host provided.');
  console.error('Usage: node check-secure-context.mjs <url-or-host>');
  process.exit(1);
}

// Accept either a full URL ("http://localhost:5173") or a bare host ("localhost").
// If no scheme is present, default to http:// so URL() can parse it.
function parse(input) {
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input);
  const candidate = hasScheme ? input : `http://${input}`;
  try {
    const u = new URL(candidate);
    return { protocol: u.protocol.replace(':', ''), hostname: u.hostname, hadScheme: hasScheme };
  } catch {
    return null;
  }
}

const parsed = parse(raw);

if (!parsed) {
  console.error(`INVALID: could not parse "${raw}" as a URL or host.`);
  process.exit(1);
}

const { protocol, hostname, hadScheme } = parsed;

const isLocalhost =
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1' ||
  hostname === '[::1]';

// RFC 1918 private LAN ranges: 10.x, 172.16-31.x, 192.168.x
function isPrivateLanIp(host) {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

const isLan = isPrivateLanIp(hostname);

function verdict(level, message) {
  console.log(`${level}: ${message}`);
  process.exit(level === 'INVALID' ? 1 : 0);
}

if (protocol !== 'http' && protocol !== 'https') {
  verdict('INVALID', `${protocol}:// is not an HTTP secure-context origin.`);
}

// Rule 1: localhost HTTP is a potentially trustworthy development origin.
if (isLocalhost) {
  if (protocol === 'https') {
    verdict(
      'WARN',
      `https on ${hostname} is a secure context ONLY with a trusted cert. ` +
        'Chromium (Chrome, Brave, Edge, Arc, Opera, Vivaldi) refuses https://localhost with a ' +
        'self-signed cert, and that cannot be detected from the URL alone. ' +
        'For local dev prefer http://localhost (no TLS), which works in every browser.'
    );
  }
  verdict('OK', `${protocol}://${hostname} is a valid secure context for WebAuthn passkey creation.`);
}

// Rule 2: HTTPS on any non-localhost host, including a private IP, is secure
// when the browser trusts the certificate. URL inspection cannot prove trust.
// but we cannot inspect the cert from the URL, so WARN.
if (protocol === 'https') {
  verdict(
    'WARN',
    `https://${hostname} is a secure context in production IF the cert is trusted. ` +
      'A self-signed or invalid cert is refused by Chromium and surfaces as a misleading ' +
      '"TLS certificate errors" WebAuthn message. This check cannot verify the cert from the URL alone.'
  );
}

// Rule 3: plain HTTP on any non-localhost host, including a private LAN IP, is
// not a secure context.
verdict(
  'INVALID',
  `http://${hostname} is not a secure context${isLan ? ' (private LAN IP)' : ''}. ` +
    'WebAuthn passkey creation requires http://localhost or https:// with a trusted cert. ' +
    'Use http://localhost for local dev, or serve over https with a valid certificate.'
);
