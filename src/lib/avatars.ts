/** Profile image resolution: custom avatar → Gravatar (valid email) → initials fallback. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIALS_TONES = [
  "bg-brand/15 text-brand",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
] as const;

export type AvatarSourceKind = "custom" | "gravatar";

export type AvatarSource = {
  kind: AvatarSourceKind;
  url: string;
};

export type ProfileAvatarInput = {
  userId: string;
  avatarUrl?: string | null;
  email?: string | null;
  name?: string | null;
  size?: number;
};

export function isValidEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const trimmed = email.trim();
  return trimmed.length > 0 && EMAIL_RE.test(trimmed);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function profileInitials(
  name?: string | null,
  email?: string | null,
  userId?: string,
): string {
  const fromName = (name ?? "").trim();
  if (fromName) {
    const initials = fromName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    if (initials) return initials;
  }

  const localPart = email?.trim().split("@")[0];
  if (localPart) {
    const initials = localPart.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
    if (initials) return initials;
  }

  if (userId) return userId.replace(/-/g, "").slice(0, 2).toUpperCase() || "?";
  return "?";
}

export function avatarInitialsTone(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % INITIALS_TONES.length;
  }
  return INITIALS_TONES[hash];
}

export function gravatarUrl(email: string, size = 128): string {
  const hash = md5Hex(normalizeEmail(email));
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404&r=g`;
}

/** Image sources to try before showing initials. */
export function buildAvatarSources({
  avatarUrl,
  email,
  size = 128,
}: ProfileAvatarInput): AvatarSource[] {
  const sources: AvatarSource[] = [];
  const trimmedAvatar = avatarUrl?.trim();

  if (trimmedAvatar) {
    sources.push({ kind: "custom", url: trimmedAvatar });
  }

  if (isValidEmail(email)) {
    sources.push({ kind: "gravatar", url: gravatarUrl(email, size) });
  }

  return sources;
}

/** First image URL if available; otherwise null (use initials). */
export function resolvePrimaryAvatarUrl(input: ProfileAvatarInput): string | null {
  return buildAvatarSources(input)[0]?.url ?? null;
}

function md5Hex(input: string): string {
  return md5(input).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Minimal MD5 — required for Gravatar hashes (RFC 1321). */
function md5(input: string): number[] {
  const bytes = utf8Encode(input);
  const words = bytesToWords(bytes);
  const bitLen = bytes.length * 8;

  words[bitLen >> 5] |= 0x80 << bitLen % 32;
  words[(((bitLen + 64) >>> 9) << 4) + 14] = bitLen;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;

    a = ff(a, b, c, d, words[i], 7, -680876936);
    d = ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, words[i + 10], 17, -42063);
    b = ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, words[i + 15], 22, 1236535329);

    a = gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = gg(b, c, d, a, words[i], 20, -373897302);
    a = gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, words[i + 12], 20, -1926607734);

    a = hh(a, b, c, d, words[i + 5], 4, -378558);
    d = hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = hh(d, a, b, c, words[i], 11, -358537222);
    c = hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = hh(b, c, d, a, words[i + 2], 23, -995338651);

    a = ii(a, b, c, d, words[i], 6, -198630844);
    d = ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = ii(b, c, d, a, words[i + 9], 21, -343485551);

    a = add(a, oa);
    b = add(b, ob);
    c = add(c, oc);
    d = add(d, od);
  }

  return wordsToBytes([a, b, c, d]);
}

function utf8Encode(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out.push(c);
    } else if (c < 2048) {
      out.push((c >> 6) | 192, (c & 63) | 128);
    } else if ((c & 0xfc00) === 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
      out.push((c >> 18) | 240, ((c >> 12) & 63) | 128, ((c >> 6) & 63) | 128, (c & 63) | 128);
    } else {
      out.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
    }
  }
  return out;
}

function bytesToWords(bytes: number[]): number[] {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << (i % 4) * 8;
  }
  return words;
}

function wordsToBytes(words: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < 4; i++) {
    out.push(words[i] & 255, (words[i] >> 8) & 255, (words[i] >> 16) & 255, (words[i] >> 24) & 255);
  }
  return out;
}

function add(x: number, y: number) {
  return (x + y) | 0;
}

function rol(x: number, n: number) {
  return (x << n) | (x >>> (32 - n));
}

function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
  return add(rol(add(add(a, q), add(x, t)), s), b);
}

function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & c) | (~b & d), a, b, x, s, t);
}

function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}
