import React, { useState } from 'react';
import {
  Smartphone,
  Shield,
  Eye,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import {
  encryptText,
  textToZeroWidth,
  inspectPayload,
  decryptPayload,
  createInstantRevealUrl,
} from '../lib/crypto';
import { sounds } from '../lib/audio';

interface ChatSimulatorProps {
  onToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onJumpToEncrypt: () => void;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ onToast, onJumpToEncrypt }) => {
  const [demoMessage, setDemoMessage] = useState('Kal shaam 7 baje flat pe aao, secret files share karni hai.');
  const [coverEmoji, setCoverEmoji] = useState('🍕');
  const [coverText, setCoverText] = useState('Bhai kal shaam ko pizza khane chalte hain');
  const [passcode, setPasscode] = useState('1234');
  const [useLock, setUseLock] = useState(true);

  // Live state
  const [isCopied, setIsCopied] = useState(false);
  const [revealedResult, setRevealedResult] = useState<string | null>(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Compute the live cloaked string and instant link
  const [encodedPayload, setEncodedPayload] = useState<string>('');
  const [demoInstantUrl, setDemoInstantUrl] = useState<string>('');

  React.useEffect(() => {
    async function update() {
      try {
        const env = await encryptText(demoMessage, useLock ? passcode : undefined);
        const zw = textToZeroWidth(env);
        const full = `${coverText} ${coverEmoji}${zw}`;
        setEncodedPayload(full);
        const url = createInstantRevealUrl(env, coverEmoji);
        setDemoInstantUrl(url);
      } catch (e) {
        console.error(e);
      }
    }
    update();
  }, [demoMessage, coverEmoji, coverText, passcode, useLock]);

  const handleCopyFromWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(encodedPayload);
      sounds.copy();
      setIsCopied(true);
      onToast('Simulated WhatsApp message copied with invisible stego bytes!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  const handleSimulatedDecode = async () => {
    sounds.click();
    setRevealing(true);
    setDecryptError(null);
    try {
      const inspected = inspectPayload(encodedPayload);
      if (!inspected.hasPayload || !inspected.rawPayload) {
        setDecryptError('No stego found');
        return;
      }

      const res = await decryptPayload(inspected.rawPayload, useLock ? enteredPasscode : undefined);
      sounds.unlock();
      setRevealedResult(res.text);
      onToast('Decrypted in simulated receiver phone!', 'success');
    } catch (err: unknown) {
      sounds.error();
      if (err instanceof Error && err.message === 'INCORRECT_PASSCODE') {
        setDecryptError('Wrong PIN! Try typing 1234.');
      } else if (err instanceof Error && err.message === 'PASSCODE_REQUIRED') {
        setDecryptError('PIN is required! Enter 1234.');
      } else {
        setDecryptError('Decryption failed.');
      }
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Live Social Media Chat Demonstration</span>
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
          Dekhein kaise WhatsApp, Instagram ya Telegram par chat karte waqt aapki privacy 100% surakshit
          rehti hai. Kisi ko bhi nahi pata chalega ki harmless pizza emoji ke andar secret documents ya
          gossip chupi hui hai!
        </p>
      </div>

      {/* 3 Step Visual Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Step 1: Sender's Screen */}
        <div className="border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Step 1: Sender (You)</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">Private</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Secret Message you write:</label>
              <textarea
                value={demoMessage}
                onChange={(e) => setDemoMessage(e.target.value)}
                rows={2}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 outline-none focus:border-emerald-500/60 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Innocent Disguise & Emoji:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const emojis = ['🍕', '🔥', '❤️', '🤫', '☕', '🎉', '👍'];
                    const next = emojis[(emojis.indexOf(coverEmoji) + 1) % emojis.length];
                    setCoverEmoji(next);
                  }}
                  className="w-10 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-lg hover:border-emerald-500/50 transition-colors"
                  title="Click to cycle cover emoji"
                >
                  {coverEmoji}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/70 flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLock}
                  onChange={(e) => setUseLock(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Lock with PIN (1234)</span>
              </label>
              {useLock && <span className="font-mono text-amber-400 text-[11px]">PIN: 1234</span>}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-500">
            Encodes secret message into invisible bytes inside {coverEmoji}.
          </div>
        </div>

        {/* Step 2: What Snoopers See on WhatsApp */}
        <div className="border border-emerald-950/40 bg-neutral-900/60 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Step 2: WhatsApp Screen</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">Public View</span>
            </div>

            <p className="text-xs text-neutral-400">
              Anyone looking at the phone, WhatsApp server, or backup sees ONLY this:
            </p>

            {/* Mock WhatsApp Chat Bubble */}
            <div className="bg-[#0b141a] p-4 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 text-[10px] text-neutral-400">
                <span className="font-semibold text-emerald-400">WhatsApp Chat</span>
                <span>Today, 10:42 PM</span>
              </div>

              {/* Chat Message Bubble: 100% PURE NORMAL TEXT + EMOJI ONLY - ZERO LINK */}
              <div className="flex justify-end">
                <div className="bg-[#005c4b] text-neutral-100 rounded-lg p-2.5 max-w-[85%] text-xs shadow space-y-1">
                  <div className="leading-relaxed">
                    {coverText} {coverEmoji}
                  </div>
                  <div className="text-[9px] text-emerald-200/70 text-right">10:42 PM ✓✓</div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400">
              🛡️ <span className="text-white font-medium">Zero Link Leak:</span> WhatsApp screen par koi URL ya link bilkul nahi dikhta. Sirf normal "{coverText} {coverEmoji}" dikhai de raha hai!
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800">
            <button
              onClick={handleCopyFromWhatsApp}
              className="w-full h-9 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Simulated Chat!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy This Chat Message</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 3: Receiver's Phone & Reveal */}
        <div className="border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5" />
                <span>Step 3: Receiver on EmojiCloak</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">Decrypted</span>
            </div>

            <p className="text-xs text-neutral-400">
              Receiver pastes the emoji message into EmojiCloak web app:
            </p>

            {useLock && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-neutral-400">Enter PIN (default: 1234):</label>
                <input
                  type="text"
                  value={enteredPasscode}
                  onChange={(e) => setEnteredPasscode(e.target.value)}
                  placeholder="Type 1234"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500/60"
                />
              </div>
            )}

            {decryptError && (
              <div className="text-[11px] text-red-400 bg-red-950/30 p-2 rounded-lg border border-red-500/30">
                {decryptError}
              </div>
            )}

            <button
              onClick={handleSimulatedDecode}
              disabled={revealing}
              className="w-full h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reveal Message</span>
            </button>

            {/* Revealed Output in Step 3 */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl min-h-[70px] flex items-center justify-center text-center">
              {revealedResult ? (
                <div className="text-xs font-medium text-emerald-300 leading-relaxed">
                  "{revealedResult}"
                </div>
              ) : (
                <span className="text-[11px] text-neutral-600">
                  Click 'Reveal Message' to see the decoded secret.
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Result: 100% Privacy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Call to Action to use the real tool */}
      <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">Ready to send your own secret messages?</div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Use the Encrypt tab to create your own cloaked emojis for WhatsApp, Instagram, or Telegram.
          </p>
        </div>
        <button
          onClick={onJumpToEncrypt}
          className="px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>Open Encrypt Tab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
