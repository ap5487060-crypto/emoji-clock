import React, { useState } from 'react';
import {
  Binary,
  Layers,
  ShieldCheck,
  Cpu,
  Code,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { ZW, inspectPayload } from '../lib/crypto';
import { sounds } from '../lib/audio';

export const StegoInspector: React.FC = () => {
  const [testString, setTestString] = useState('🍕\uFEFF\u200D\uFEFF\u200B\u200C\u200D\u2060\uFEFF\u200C\uFEFF');

  // Breakdown codepoints
  const codepointBreakdown = Array.from(testString).map((char, idx) => {
    const codePoint = char.codePointAt(0) || 0;
    const hex = 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');
    let type = 'Visible Glyph';
    let isZeroWidth = false;

    if (char === ZW.ZERO) {
      type = 'Zero-Width Space (ZWSP / 00)';
      isZeroWidth = true;
    } else if (char === ZW.ONE) {
      type = 'Zero-Width Non-Joiner (ZWNJ / 01)';
      isZeroWidth = true;
    } else if (char === ZW.TWO) {
      type = 'Zero-Width Joiner (ZWJ / 10)';
      isZeroWidth = true;
    } else if (char === ZW.THREE) {
      type = 'Word Joiner (WJ / 11)';
      isZeroWidth = true;
    } else if (char === '\uFEFF') {
      type = 'Zero-Width No-Break Space (Header Flag)';
      isZeroWidth = true;
    }

    return {
      index: idx,
      char,
      codePoint,
      hex,
      type,
      isZeroWidth,
    };
  });

  const inspection = inspectPayload(testString);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Unicode Steganography & Cipher Deep Inspector</span>
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
          Deep-level technical architecture inspection: dekhein kaise Unicode codepoints ke andar binary data
          encode hota hai aur WhatsApp/Instagram isse kyu block nahi kar sakte.
        </p>
      </div>

      {/* Interactive Codepoint Dissector */}
      <div className="border border-neutral-800 bg-neutral-900/40 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Binary className="w-4 h-4 text-emerald-400" />
            <span>Interactive Unicode Character Dissector</span>
          </label>
          <span className="text-xs text-neutral-500 font-mono tabular-nums">
            {codepointBreakdown.length} codepoints analyzed
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Paste any emoji or cloaked text here to inspect its internal Unicode codepoints..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 outline-none focus:border-emerald-500/60"
          />
          <p className="text-[11px] text-neutral-500">
            Paste anything generated from the Encrypt tab or received on WhatsApp to see invisible bytes.
          </p>
        </div>

        {/* Codepoint Table */}
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 text-neutral-400 text-[11px] sticky top-0 border-b border-neutral-800 font-medium">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Glyph Preview</th>
                  <th className="py-2.5 px-3 font-mono">Unicode Code</th>
                  <th className="py-2.5 px-3">Category / Role</th>
                  <th className="py-2.5 px-3">Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                {codepointBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-600 font-sans">
                      Enter or paste text above to dissect codepoints.
                    </td>
                  </tr>
                ) : (
                  codepointBreakdown.map((item) => (
                    <tr
                      key={item.index}
                      className={item.isZeroWidth ? 'bg-emerald-950/10' : 'bg-transparent'}
                    >
                      <td className="py-2 px-3 text-neutral-500 tabular-nums">{item.index + 1}</td>
                      <td className="py-2 px-3 text-base font-sans">
                        {item.isZeroWidth ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            [INVISIBLE]
                          </span>
                        ) : (
                          item.char
                        )}
                      </td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold">{item.hex}</td>
                      <td className="py-2 px-3 text-neutral-300 font-sans text-[11px]">
                        {item.type}
                      </td>
                      <td className="py-2 px-3">
                        {item.isZeroWidth ? (
                          <span className="text-emerald-400 text-[10px] font-sans font-medium">
                            Zero Width
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[10px] font-sans">Visible</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deep Technical FAQs & How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="border border-neutral-800 bg-neutral-900/40 rounded-2xl p-5 space-y-3">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Kyu WhatsApp & Instagram Isse Filter Nahi Karte?</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Unicode Standard me <code className="text-emerald-400 font-mono">Zero-Width Joiner (ZWJ)</code>{' '}
            aur <code className="text-emerald-400 font-mono">Zero-Width Non-Joiner (ZWNJ)</code> official
            characters hain. Inka use complex Indian scripts (Devanagari matras, halant), Arabic, aur
            composite emojis (jaise 👨‍💻 = 👨 + ZWJ + 💻, skin tones, couple emojis) ke liye mandatory
            hota hai.
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Agar WhatsApp ya Instagram in characters ko delete kar dega, to world ke aade emojis aur
            Indian languages toot jayengi! Isiliye messaging platforms zero-width bytes ko 100% intact
            rakhte hain.
          </p>
        </div>

        <div className="border border-neutral-800 bg-neutral-900/40 rounded-2xl p-5 space-y-3">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Military-Grade Cryptographic Architecture</span>
          </div>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">AES-256-GCM:</strong> Authenticated cipher providing
                both confidentiality and message tamper resistance.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">PBKDF2 Key Derivation:</strong> 100,000 iterations
                with cryptographic random 16-byte salt to prevent brute-force attacks.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Zero Server Transit:</strong> 100% Web Crypto API in
                browser RAM. No database, no telemetry, no leaks.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
