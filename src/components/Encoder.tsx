import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Send,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Share2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { POPULAR_CARRIER_EMOJIS } from '../lib/disguiseTemplates';
import {
  encryptText,
  textToZeroWidth,
  createInstantRevealUrl,
} from '../lib/crypto';
import { sounds } from '../lib/audio';

interface EncoderProps {
  onSendToDecoder: (payload: string, passcode?: string) => void;
  onToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const Encoder: React.FC<EncoderProps> = ({ onSendToDecoder, onToast }) => {
  const [secretText, setSecretText] = useState(() => {
    return sessionStorage.getItem('emojicloak_draft_text') || '';
  });
  const [selectedEmoji, setSelectedEmoji] = useState(() => {
    return sessionStorage.getItem('emojicloak_draft_emoji') || '🍕';
  });
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [coverNote, setCoverNote] = useState(() => {
    return sessionStorage.getItem('emojicloak_draft_cover') || '';
  });

  // Secret Code / Passcode Protection
  const [secretPasscode, setSecretPasscode] = useState(() => {
    return sessionStorage.getItem('emojicloak_draft_code') || '';
  });
  const [showPasscode, setShowPasscode] = useState(false);

  // Sync draft to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('emojicloak_draft_text', secretText);
    sessionStorage.setItem('emojicloak_draft_emoji', selectedEmoji);
    sessionStorage.setItem('emojicloak_draft_cover', coverNote);
    sessionStorage.setItem('emojicloak_draft_code', secretPasscode);
  }, [secretText, selectedEmoji, coverNote, secretPasscode]);

  // Mode: 'pure_emoji' = ONLY EMOJI (No link whatsoever)
  // 'tap_link' = Emoji with 1-tap open link
  const [sendMode, setSendMode] = useState<'pure_emoji' | 'tap_link'>('pure_emoji');

  // Output
  const [generatedPureEmoji, setGeneratedPureEmoji] = useState('');
  const [instantUrl, setInstantUrl] = useState('');
  const [copiedEmoji, setCopiedEmoji] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const carrier = customEmojiInput.trim() || selectedEmoji;

  // Re-encode whenever inputs change (including secretPasscode)
  useEffect(() => {
    let active = true;

    async function generate() {
      if (!secretText.trim()) {
        setGeneratedPureEmoji('');
        setInstantUrl('');
        return;
      }

      try {
        // Encrypt with military AES-256-GCM if secretPasscode is set
        const envelopeString = await encryptText(secretText, secretPasscode.trim());
        const zwStream = textToZeroWidth(envelopeString);
        
        // Pure Stego Emoji: Visible carrier emoji + invisible Unicode bytes
        const pureEmojiOutput = coverNote.trim()
          ? `${coverNote.trim()} ${carrier}${zwStream}`
          : `${carrier}${zwStream}`;

        const link = createInstantRevealUrl(envelopeString, carrier);

        if (active) {
          setGeneratedPureEmoji(pureEmojiOutput);
          setInstantUrl(link);
        }
      } catch (err) {
        console.error('Encoding error:', err);
      }
    }

    const timer = setTimeout(generate, 80);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [secretText, carrier, coverNote, secretPasscode]);

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    sounds.click();
    let textToSend = '';

    if (sendMode === 'pure_emoji') {
      // 100% PURE EMOJI - BILKUL KOI LINK NAHI JAYEGA!
      textToSend = generatedPureEmoji;
    } else {
      // Tap-to-reveal link
      textToSend = coverNote.trim()
        ? `${coverNote.trim()}\n\n${carrier} (Tap to reveal):\n${instantUrl}`
        : `${carrier} (Tap to reveal):\n${instantUrl}`;
    }

    if (!textToSend) return;
    const url = `https://wa.me/?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    if (sendMode === 'pure_emoji') {
      onToast('WhatsApp open! Sirf Pure Emoji ja raha hai (0% link).', 'success');
    } else {
      onToast('WhatsApp open! 1-Tap reveal link attach kiya gaya.', 'info');
    }
  };

  // Telegram Share Handler
  const handleShareTelegram = () => {
    sounds.click();
    let textToSend = '';
    if (sendMode === 'pure_emoji') {
      textToSend = generatedPureEmoji;
      const url = `https://t.me/share/url?url=&text=${encodeURIComponent(textToSend)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const url = `https://t.me/share/url?url=${encodeURIComponent(instantUrl)}&text=${encodeURIComponent(
        coverNote.trim() ? `${coverNote.trim()} ${carrier}` : `${carrier} Secret`
      )}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    onToast('Telegram opened!', 'info');
  };

  // Copy Pure Emoji (No Link)
  const handleCopyPureEmoji = async () => {
    if (!generatedPureEmoji) return;
    try {
      await navigator.clipboard.writeText(generatedPureEmoji);
      sounds.copy();
      setCopiedEmoji(true);
      onToast(
        secretPasscode.trim()
          ? 'Locked Secret Emoji Copied! (PIN code se protect hai)'
          : '100% Pure Emoji Copied! (Isme koi bhi link nahi hai)',
        'success'
      );
      setTimeout(() => setCopiedEmoji(false), 2000);
    } catch {
      onToast('Failed to copy', 'error');
    }
  };

  // Copy Tap-to-reveal link
  const handleCopyLink = async () => {
    if (!instantUrl) return;
    try {
      const msg = coverNote.trim()
        ? `${coverNote.trim()}\n\n${carrier} (Tap to reveal):\n${instantUrl}`
        : `${carrier} (Tap to reveal):\n${instantUrl}`;
      await navigator.clipboard.writeText(msg);
      sounds.copy();
      setCopiedLink(true);
      onToast('Emoji tap link copied!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onToast('Failed to copy', 'error');
    }
  };

  // Test In Decoder (Auto open verification)
  const handleTestInDecoder = () => {
    if (!generatedPureEmoji) return;
    sounds.lock();
    // Test pure emoji steganography in decoder along with passcode
    onSendToDecoder(
      sendMode === 'pure_emoji' ? generatedPureEmoji : instantUrl,
      secretPasscode.trim()
    );
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Secret Message to Emoji (Zero Link Stego)</span>
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
          Yahan apna message likhein aur chahein to <strong className="text-emerald-400">Secret Code / PIN</strong> lagakar lock kar dein. 
          WhatsApp par <strong className="text-emerald-400">sirf normal emoji jayega, koi bhi link nahi dikhega!</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Secret Message Input Box */}
          <div className="border border-neutral-800/90 bg-neutral-900/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>1. Secret Message Likhein</span>
              </label>
              <span className="text-xs text-neutral-500 font-mono">
                {secretText.length} characters
              </span>
            </div>

            <textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Yahan apna gupt sandesh / secret message likhein..."
              rows={4}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 rounded-xl p-3.5 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-all resize-y"
            />
          </div>

          {/* SECRET CODE / PIN PROTECTION (FEATURE REQUESTED) */}
          <div className="border border-neutral-800/90 bg-neutral-900/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>2. Secret Code / Password Lagayein</span>
              </label>
              <span className="text-[11px] font-medium text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {secretPasscode.trim() ? '🔒 Code Active' : 'Optional'}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Agar aap chahte hain ki bina sahi Code / PIN dale koi bhi message na padh sake, to yahan apna secret code set karein (Jaise: <code>1234</code>, <code>bhai@99</code>, etc.):
            </p>

            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={secretPasscode}
                onChange={(e) => setSecretPasscode(e.target.value)}
                placeholder="Secret code / PIN likhein (e.g. 7860 ya password)..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                aria-label={showPasscode ? 'Hide secret code' : 'Show secret code'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {secretPasscode.trim() && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/20 p-2 rounded-lg">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Ye message 256-bit AES military encryption se lock ho chuka hai. Saamne wale ko yahi code daalna hoga!</span>
              </div>
            )}
          </div>

          {/* Carrier Emoji Selection */}
          <div className="border border-neutral-800/90 bg-neutral-900/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <span className="text-lg">{carrier}</span>
                <span>3. Pasandida Emoji Chuniye</span>
              </label>
              <span className="text-xs text-neutral-400">Normal emoji dikhega</span>
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
              {POPULAR_CARRIER_EMOJIS.slice(0, 24).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setSelectedEmoji(emoji);
                    setCustomEmojiInput('');
                  }}
                  className={`h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
                    selectedEmoji === emoji && !customEmojiInput
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 scale-105'
                      : 'bg-neutral-950 hover:bg-neutral-800 border border-neutral-800/80 text-neutral-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Optional Custom Emoji */}
            <input
              type="text"
              value={customEmojiInput}
              onChange={(e) => setCustomEmojiInput(e.target.value)}
              placeholder="Ya koi aur emoji type karein (e.g. 🍫, 🤫, 🔥, 🚀)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-emerald-500/60"
            />

            {/* Optional normal chat sentence */}
            <div className="pt-2 border-t border-neutral-800/70 space-y-1.5">
              <label className="text-xs text-neutral-400">
                Optional Normal Baat (Jaise: "Bhai ye dekh", "Plan confirm hai", etc.)
              </label>
              <input
                type="text"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="e.g. Kal ka plan confirm hai"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Instant Send & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5 space-y-4 sticky top-20">
            {/* Format Selection Tab: Pure Emoji vs Tap Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Sharing Format:
              </label>
              <div className="grid grid-cols-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setSendMode('pure_emoji');
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                    sendMode === 'pure_emoji'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  ✨ Sirf Pure Emoji (No Link)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setSendMode('tap_link');
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                    sendMode === 'tap_link'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  🔗 1-Tap Reveal Link
                </button>
              </div>
            </div>

            {/* Visual Box of What People See in WhatsApp */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 min-h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                <span>WhatsApp par aisa dikhega:</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {sendMode === 'pure_emoji' ? '🛡️ ZERO LINK' : '⚡ INSTANT LINK'}
                </span>
              </div>

              {secretText.trim() ? (
                <div className="my-auto py-2">
                  <div className="bg-[#005c4b] text-neutral-100 p-3 rounded-xl text-xs space-y-1.5 max-w-[95%]">
                    {coverNote.trim() && (
                      <div className="font-normal text-neutral-200">{coverNote}</div>
                    )}
                    
                    {sendMode === 'pure_emoji' ? (
                      /* 100% PURE EMOJI ONLY - ZERO LINK AT ALL */
                      <div className="text-3xl my-1 flex items-center gap-2">
                        <span>{carrier}</span>
                        {secretPasscode.trim() && (
                          <span className="text-[11px] bg-black/40 px-2 py-0.5 rounded text-amber-300 flex items-center gap-1 font-mono">
                            <Lock className="w-3 h-3" /> PIN Locked
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{carrier}</span>
                          <span className="text-[11px] text-emerald-300">
                            {secretPasscode.trim() ? '(PIN Locked - Tap to reveal)' : '(Tap to reveal)'}
                          </span>
                        </div>
                        <div className="text-[10px] text-sky-300 underline break-all opacity-80">
                          {window.location.origin}/#m=...
                        </div>
                      </div>
                    )}
                    <div className="text-[9px] text-emerald-200/60 text-right">10:45 PM ✓✓</div>
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center py-6 text-xs text-neutral-600">
                  Left side par secret message likhein...
                </div>
              )}

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span>{secretPasscode.trim() ? '🔒 Password Protected' : '🔓 Unlocked Stego'}</span>
                <span className="text-emerald-400">{carrier} Ready</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* PRIMARY 1-CLICK SEND ON WHATSAPP */}
              <button
                type="button"
                disabled={!generatedPureEmoji}
                onClick={handleShareWhatsApp}
                className={`w-full h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  generatedPureEmoji
                    ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 active:scale-[0.98] shadow-lg shadow-emerald-500/25'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4 text-neutral-950 fill-neutral-950" />
                <span>
                  {sendMode === 'pure_emoji'
                    ? 'Send Pure Emoji on WhatsApp (Bilkul No Link)'
                    : 'Send Emoji Link on WhatsApp'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* COPY BUTTON */}
                <button
                  type="button"
                  disabled={!generatedPureEmoji}
                  onClick={sendMode === 'pure_emoji' ? handleCopyPureEmoji : handleCopyLink}
                  className="h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  {(sendMode === 'pure_emoji' ? copiedEmoji : copiedLink) ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        {sendMode === 'pure_emoji' ? 'Copy Pure Emoji' : 'Copy Emoji Link'}
                      </span>
                    </>
                  )}
                </button>

                {/* TELEGRAM */}
                <button
                  type="button"
                  disabled={!generatedPureEmoji}
                  onClick={handleShareTelegram}
                  className="h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Send Telegram</span>
                </button>
              </div>

              {/* TEST REVEAL */}
              <button
                type="button"
                disabled={!generatedPureEmoji}
                onClick={handleTestInDecoder}
                className="w-full h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <span>Test Secret Reveal (Dekhein kaise khulta hai)</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>

            {/* Explanation Note */}
            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/60 text-xs text-neutral-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                {secretPasscode.trim() ? (
                  <span>
                    <strong className="text-amber-400">Secret Code Protected:</strong> Emoji ke andar message encrypted hai. Jab tak koi sahi code (<code>{secretPasscode}</code>) nahi dalega, message decode nahi hoga!
                  </span>
                ) : (
                  <span>
                    <strong className="text-white">Direct Unlock:</strong> Koi password nahi lagaya hai. Emoji paste hote hi message bina code ke turant khul jayega.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
