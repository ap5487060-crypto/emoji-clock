/**
 * EmojiCloak Cryptography & Steganography Engine
 * Supports:
 * 1. Invisible Zero-Width Steganography (Embeds full encrypted/plain text into innocent emoji)
 * 2. Visual Emoji Matrix Cipher (Translates ciphertext into sequence of themed emojis)
 * 3. AES-256-GCM client-side encryption via Web Crypto API with PBKDF2 derivation
 */

// Zero-width character map for 2-bit quaternary encoding (4 chars per byte)
export const ZW = {
  ZERO: '\u200B', // Zero-Width Space (00)
  ONE: '\u200C',  // Zero-Width Non-Joiner (01)
  TWO: '\u200D',  // Zero-Width Joiner (10)
  THREE: '\u2060', // Word Joiner (11)
  START_MARKER: '\uFEFF\u200D\uFEFF', // Header prefix to identify EmojiCloak payload
  END_MARKER: '\uFEFF\u200C\uFEFF',   // Header suffix
};

export const ZW_CHARS = [ZW.ZERO, ZW.ONE, ZW.TWO, ZW.THREE];

// Emoji Cipher Palettes for Visual Emoji Matrix mode
export const EMOJI_PALETTES: Record<string, { name: string; icon: string; emojis: string[] }> = {
  cyber: {
    name: 'Cyberpunk & Tech',
    icon: '⚡',
    emojis: ['👾', '🛸', '⚡', '🔥', '💎', '🪐', '🦊', '✨', '🔮', '🚀', '🥑', '🎯', '🧩', '🕶️', '💾', '🛰️'],
  },
  secret_agent: {
    name: 'Secret Agent',
    icon: '🕵️',
    emojis: ['🕵️', '🔒', '🗝️', '💼', '🕶️', '📁', '📜', '🧭', '⏱️', '🎙️', '🔦', '🎩', '🛡️', '📦', '♟️', '🔍'],
  },
  food: {
    name: 'Food & Treats',
    icon: '🍕',
    emojis: ['🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍪', '🍫', '🍦', '🍓', '🥑', '🥐', '🍿', '🧁', '🥞', '🥨'],
  },
  nature: {
    name: 'Nature & Mystic',
    icon: '🌿',
    emojis: ['🌿', '🌸', '🍄', '🌙', '⭐', '🌊', '🍁', '🦋', '🔮', '🪐', '🌋', '🌵', '🌺', '🍀', '✨', '🌈'],
  },
  faces: {
    name: 'Playful Reactions',
    icon: '😎',
    emojis: ['😎', '🤫', '🫡', '👀', '🥳', '🤔', '😴', '😇', '🤠', '🤐', '🤗', '🤩', '🧐', '🤯', '👻', '👽'],
  },
};

export type CipherMode = 'steganography' | 'visual_emoji';

export interface EncryptedEnvelope {
  version: 1;
  encrypted: boolean;
  iv?: string; // base64
  salt?: string; // base64
  data: string; // base64 of ciphertext or raw utf-8 string
}

// Helper: Convert Uint8Array to Base64URL (safe for URL hash/query without escaping)
export function bufferToBase64Url(buf: Uint8Array): string {
  let binary = '';
  const len = buf.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper: Convert Base64URL to Uint8Array
export function base64UrlToBuffer(b64url: string): Uint8Array {
  let base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert string to URL-safe base64
export function stringToBase64Url(str: string): string {
  const enc = new TextEncoder();
  return bufferToBase64Url(enc.encode(str));
}

// Convert URL-safe base64 to string
export function base64UrlToString(b64url: string): string {
  const bytes = base64UrlToBuffer(b64url);
  const dec = new TextDecoder();
  return dec.decode(bytes);
}

// Helper: Convert Uint8Array to Base64
function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  const len = buf.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-256-GCM key from passcode using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// AES-256-GCM Encrypt
export async function encryptText(plaintext: string, passcode?: string): Promise<string> {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(plaintext);

  if (!passcode || passcode.trim() === '') {
    // Open envelope with integrity tag
    const envelope: EncryptedEnvelope = {
      version: 1,
      encrypted: false,
      data: bufferToBase64(rawBytes),
    };
    return JSON.stringify(envelope);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passcode, salt);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    rawBytes as unknown as BufferSource
  );

  const envelope: EncryptedEnvelope = {
    version: 1,
    encrypted: true,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(new Uint8Array(ciphertext)),
  };

  return JSON.stringify(envelope);
}

// AES-256-GCM Decrypt
export async function decryptPayload(
  serializedEnvelope: string,
  passcode?: string
): Promise<{ text: string; wasEncrypted: boolean }> {
  let envelope: EncryptedEnvelope;
  try {
    envelope = JSON.parse(serializedEnvelope);
  } catch {
    throw new Error('CORRUPTED_PAYLOAD');
  }

  if (envelope.version !== 1 || !envelope.data) {
    throw new Error('INVALID_VERSION');
  }

  if (!envelope.encrypted) {
    const rawBytes = base64ToBuffer(envelope.data);
    const decoder = new TextDecoder();
    return { text: decoder.decode(rawBytes), wasEncrypted: false };
  }

  if (!passcode || passcode.trim() === '') {
    throw new Error('PASSCODE_REQUIRED');
  }

  if (!envelope.salt || !envelope.iv) {
    throw new Error('CORRUPTED_ENVELOPE');
  }

  const salt = base64ToBuffer(envelope.salt);
  const iv = base64ToBuffer(envelope.iv);
  const ciphertext = base64ToBuffer(envelope.data);

  try {
    const key = await deriveKey(passcode, salt);
    const decryptedBuf = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );
    const decoder = new TextDecoder();
    return { text: decoder.decode(decryptedBuf), wasEncrypted: true };
  } catch {
    throw new Error('INCORRECT_PASSCODE');
  }
}

// --- STEGANOGRAPHY: UTF-8 String to Quaternary Zero-Width Stream ---

export function textToZeroWidth(text: string): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(text);
  let zwResult = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // 4 base-4 dibits per byte: (byte >> 6) & 3, (byte >> 4) & 3, (byte >> 2) & 3, byte & 3
    const d0 = (byte >> 6) & 3;
    const d1 = (byte >> 4) & 3;
    const d2 = (byte >> 2) & 3;
    const d3 = byte & 3;

    zwResult += ZW_CHARS[d0] + ZW_CHARS[d1] + ZW_CHARS[d2] + ZW_CHARS[d3];
  }

  return ZW.START_MARKER + zwResult + ZW.END_MARKER;
}

export function zeroWidthToText(zwStr: string): string | null {
  const startIdx = zwStr.indexOf(ZW.START_MARKER);
  const endIdx = zwStr.indexOf(ZW.END_MARKER);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  const payloadZw = zwStr.substring(startIdx + ZW.START_MARKER.length, endIdx);
  const charArray: number[] = [];

  for (let i = 0; i < payloadZw.length; i++) {
    const ch = payloadZw[i];
    const val = ZW_CHARS.indexOf(ch);
    if (val !== -1) {
      charArray.push(val);
    }
  }

  if (charArray.length % 4 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(charArray.length / 4);
  for (let i = 0; i < bytes.length; i++) {
    const base = i * 4;
    const byte =
      (charArray[base] << 6) |
      (charArray[base + 1] << 4) |
      (charArray[base + 2] << 2) |
      charArray[base + 3];
    bytes[i] = byte;
  }

  try {
    const dec = new TextDecoder();
    return dec.decode(bytes);
  } catch {
    return null;
  }
}

// --- VISUAL EMOJI MATRIX: Base-16 Nibble to Emoji Mapping ---

export function textToVisualEmoji(text: string, paletteKey: string = 'cyber'): string {
  const palette = EMOJI_PALETTES[paletteKey] || EMOJI_PALETTES.cyber;
  const enc = new TextEncoder();
  const bytes = enc.encode(text);
  let result = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    const highNibble = (byte >> 4) & 0x0f;
    const lowNibble = byte & 0x0f;
    result += palette.emojis[highNibble] + palette.emojis[lowNibble];
  }

  // Prepend palette identifier marker + wrap
  return `[${palette.icon}EMOJI-CLOAK:${paletteKey}]` + result + `[/${palette.icon}]`;
}

export function visualEmojiToText(emojiStr: string): string | null {
  const regex = /\[.EMOJI-CLOAK:([a-z_]+)\](.*?)\[\/.\]/su;
  const match = emojiStr.match(regex);

  if (!match) {
    // Try to fallback check if there's any palette match directly
    return null;
  }

  const paletteKey = match[1];
  const body = match[2];
  const palette = EMOJI_PALETTES[paletteKey] || EMOJI_PALETTES.cyber;

  // Split string into unicode emoji glyphs
  const glyphs = Array.from(body);
  if (glyphs.length % 2 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(glyphs.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const highGlyph = glyphs[i * 2];
    const lowGlyph = glyphs[i * 2 + 1];

    const highIdx = palette.emojis.indexOf(highGlyph);
    const lowIdx = palette.emojis.indexOf(lowGlyph);

    if (highIdx === -1 || lowIdx === -1) {
      return null;
    }

    bytes[i] = (highIdx << 4) | lowIdx;
  }

  try {
    const dec = new TextDecoder();
    return dec.decode(bytes);
  } catch {
    return null;
  }
}

// Auto-detect what kind of payload is in the input
export interface DetectionResult {
  hasPayload: boolean;
  type: 'steganography' | 'visual_emoji' | 'none';
  coverEmoji: string;
  rawPayload: string | null;
  visibleText: string;
  hiddenByteCount: number;
}

// Generate Instant 1-Tap Reveal Link
export function createInstantRevealUrl(
  envelopeString: string,
  carrierEmoji: string = '🍕'
): string {
  const base64Url = stringToBase64Url(envelopeString);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // Encode emoji in param so the link has the emoji right in it: /#m=...&e=🍕
  return `${origin}${pathname}#m=${base64Url}&e=${encodeURIComponent(carrierEmoji)}`;
}

// Generate Instant WhatsApp/Social Message with Clickable Emoji Link
export function createClickableEmojiMessage(
  disguiseText: string,
  carrierEmoji: string,
  instantUrl: string
): string {
  if (disguiseText && disguiseText.trim()) {
    return `${disguiseText.trim()}\n\n${carrierEmoji} (Tap emoji to reveal):\n${instantUrl}`;
  }
  return `${carrierEmoji} (Tap to reveal secret message):\n${instantUrl}`;
}

export function inspectPayload(input: string): DetectionResult {
  if (!input) {
    return {
      hasPayload: false,
      type: 'none',
      coverEmoji: '',
      rawPayload: null,
      visibleText: '',
      hiddenByteCount: 0,
    };
  }

  // Check 0: Instant URL or URL Fragment (#m=... or ?m=...)
  try {
    let urlString = input.trim();
    // Check if input contains a URL with #m= or ?m=
    const match = urlString.match(/[#?&]m=([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      const extractedRaw = base64UrlToString(match[1]);
      // Also check if emoji param exists
      const emojiMatch = urlString.match(/[#?&]e=([^&]+)/);
      const emoji = emojiMatch ? decodeURIComponent(emojiMatch[1]) : '⚡';
      return {
        hasPayload: true,
        type: 'steganography',
        coverEmoji: emoji,
        rawPayload: extractedRaw,
        visibleText: 'Instant 1-Tap Link',
        hiddenByteCount: match[1].length,
      };
    }
  } catch {
    // continue to regular checks
  }

  // Check 1: Invisible Steganography
  const zwPayload = zeroWidthToText(input);
  if (zwPayload !== null) {
    // Extract visible characters by filtering out ZW characters
    let visible = '';
    for (const char of input) {
      if (
        char !== ZW.ZERO &&
        char !== ZW.ONE &&
        char !== ZW.TWO &&
        char !== ZW.THREE &&
        char !== '\uFEFF'
      ) {
        visible += char;
      }
    }

    // Try finding the first emoji in visible text
    const emojiMatch = visible.match(/\p{Extended_Pictographic}/u);
    const cover = emojiMatch ? emojiMatch[0] : (visible.trim() || '🤫');

    return {
      hasPayload: true,
      type: 'steganography',
      coverEmoji: cover,
      rawPayload: zwPayload,
      visibleText: visible.trim(),
      hiddenByteCount: Math.floor(input.length / 4),
    };
  }

  // Check 2: Visual Emoji Matrix
  const visualPayload = visualEmojiToText(input);
  if (visualPayload !== null) {
    return {
      hasPayload: true,
      type: 'visual_emoji',
      coverEmoji: '✨',
      rawPayload: visualPayload,
      visibleText: input.length > 30 ? input.slice(0, 30) + '...' : input,
      hiddenByteCount: Math.floor(input.length / 2),
    };
  }

  return {
    hasPayload: false,
    type: 'none',
    coverEmoji: '',
    rawPayload: null,
    visibleText: input,
    hiddenByteCount: 0,
  };
}
