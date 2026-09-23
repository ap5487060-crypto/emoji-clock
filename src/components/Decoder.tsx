import React, { useState, useEffect, useRef } from 'react';
import {
  Unlock,
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  Flame,
  AlertCircle,
  Sparkles,
  ClipboardPaste,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  inspectPayload,
  decryptPayload,
  DetectionResult,
} from '../lib/crypto';
import { sounds } from '../lib/audio';

interface DecoderProps {
  initialPayload?: string;
  initialPasscode?: string;
  onToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const Decoder: React.FC<DecoderProps> = ({
  initialPayload = '',
  initialPasscode = '',
  onToast,
}) => {
  const [inputData, setInputData] = useState(initialPayload);
  const [passcode, setPasscode] = useState(initialPasscode);
  const [showPasscode, setShowPasscode] = useState(false);

  const [inspection, setInspection] = useState<DetectionResult | null>(null);
  const [revealedText, setRevealedText] = useState<string | null>(null);
  const [displayAnimatedText, setDisplayAnimatedText] = useState<string>('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Privacy features
  const [isMasked, setIsMasked] = useState(false);
  const [burnTimerSec, setBurnTimerSec] = useState<number | null>(null);
  const [burnTotalSec, setBurnTotalSec] = useState<number>(30);
  const [copied, setCopied] = useState(false);

  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const burnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // When initialPayload changes (e.g. from "Test in Decoder" button)
  useEffect(() => {
    if (initialPayload) {
      setInputData(initialPayload);
    }
    if (initialPasscode) {
      setPasscode(initialPasscode);
    }
  }, [initialPayload, initialPasscode]);

  // Inspect input whenever it changes
  useEffect(() => {
    setRevealedText(null);
    setDisplayAnimatedText('');
    setErrorMsg(null);
    if (burnIntervalRef.current) clearInterval(burnIntervalRef.current);
    setBurnTimerSec(null);

    if (!inputData.trim()) {
      setInspection(null);
      return;
    }

    const res = inspectPayload(inputData);
    setInspection(res);

    // Auto-reveal if payload is present and either unencrypted or already has passcode provided
    if (res.hasPayload && res.rawPayload) {
      try {
        const envelope = JSON.parse(res.rawPayload);
        if (!envelope.encrypted || passcode.trim()) {
          // Trigger instant auto-reveal without requiring extra button click
          decryptPayload(res.rawPayload, passcode.trim())
            .then((result) => {
              sounds.unlock();
              setRevealedText(result.text);
              setIsEncrypted(result.wasEncrypted);
              triggerMatrixAnimation(result.text);
              onToast('⚡ Instant Link Auto-Revealed!', 'success');
              if (burnTotalSec > 0) {
                startBurnCountdown(burnTotalSec);
              }
            })
            .catch(() => {
              // Wait for user manual passcode entry
            });
        }
      } catch {
        // rawPayload could be non-JSON in other modes
      }
    }
  }, [inputData, passcode]);

  // Matrix Scramble Decipher Effect
  const triggerMatrixAnimation = (finalPlaintext: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=~';
    let iteration = 0;
    const maxIterations = Math.min(20, Math.max(10, finalPlaintext.length));

    if (animTimerRef.current) clearInterval(animTimerRef.current);

    animTimerRef.current = setInterval(() => {
      setDisplayAnimatedText(
        finalPlaintext
          .split('')
          .map((char, index) => {
            if (char === ' ' || char === '\n') return char;
            if (index < (iteration / maxIterations) * finalPlaintext.length) {
              return finalPlaintext[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      iteration++;
      if (iteration > maxIterations) {
        if (animTimerRef.current) clearInterval(animTimerRef.current);
        setDisplayAnimatedText(finalPlaintext);
      }
    }, 28);
  };

  const handleDecrypt = async () => {
    if (!inspection || !inspection.hasPayload || !inspection.rawPayload) {
      sounds.error();
      setErrorMsg('No valid hidden emoji payload found in input. Please paste the cloaked emoji.');
      return;
    }

    setIsDecrypting(true);
    setErrorMsg(null);

    try {
      const result = await decryptPayload(inspection.rawPayload, passcode.trim());
      sounds.unlock();
      setRevealedText(result.text);
      setIsEncrypted(result.wasEncrypted);
      triggerMatrixAnimation(result.text);
      onToast('Message revealed successfully!', 'success');

      // Start burn countdown if active
      if (burnTotalSec > 0) {
        startBurnCountdown(burnTotalSec);
      }
    } catch (err: unknown) {
      sounds.error();
      if (err instanceof Error) {
        if (err.message === 'PASSCODE_REQUIRED') {
          setErrorMsg('This secret message is protected with a PIN/Passcode. Please enter it below.');
        } else if (err.message === 'INCORRECT_PASSCODE') {
          setErrorMsg('Galat Passcode! The entered passcode is incorrect.');
        } else {
          setErrorMsg('Could not decrypt message. Payload might be corrupted or incomplete.');
        }
      } else {
        setErrorMsg('Decryption failed.');
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const startBurnCountdown = (seconds: number) => {
    if (burnIntervalRef.current) clearInterval(burnIntervalRef.current);
    setBurnTimerSec(seconds);

    burnIntervalRef.current = setInterval(() => {
      setBurnTimerSec((prev) => {
        if (prev === null || prev <= 1) {
          if (burnIntervalRef.current) clearInterval(burnIntervalRef.current);
          setRevealedText(null);
          setDisplayAnimatedText('');
          setInputData('');
          onToast('Secret message self-destructed for privacy!', 'warning');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sounds.click();
        setInputData(text);
        onToast('Pasted from clipboard!', 'info');
      } else {
        onToast('Clipboard is empty', 'warning');
      }
    } catch {
      onToast('Clipboard permission denied. Please paste manually.', 'warning');
    }
  };

  const handleCopyRevealed = async () => {
    if (!revealedText) return;
    try {
      await navigator.clipboard.writeText(revealedText);
      sounds.copy();
      setCopied(true);
      onToast('Secret message copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Failed to copy', 'error');
    }
  };

  const handleClear = () => {
    sounds.click();
    setInputData('');
    setPasscode('');
    setRevealedText(null);
    setDisplayAnimatedText('');
    setErrorMsg(null);
    if (burnIntervalRef.current) clearInterval(burnIntervalRef.current);
    setBurnTimerSec(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Revealed Secret Message</span>
          <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Direct 1-Click Auto Open
          </span>
        </h1>
        <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
          Emoji par click hote hi ye website direct open ho jati hai aur secret message bina kisi manual paste ke automatically unlock hokar saaf-saaf dikhai deta hai!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input and Decryption controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-neutral-800/90 bg-neutral-900/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <span>1. Paste Received Emoji / Message</span>
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-xs px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paste from Clipboard</span>
              </button>
            </div>

            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Paste emoji received on WhatsApp (e.g. 🍕 or full message with emoji)..."
              rows={4}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 rounded-xl p-3.5 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-all resize-y"
            />

            {/* Auto-Inspector Bar */}
            {inspection && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  inspection.hasPayload
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-lg shrink-0">
                    {inspection.coverEmoji || (inspection.hasPayload ? '🤫' : '🔍')}
                  </span>
                  <div className="truncate">
                    {inspection.hasPayload ? (
                      <span className="font-medium text-emerald-200">
                        {inspection.type === 'steganography'
                          ? `Steganographic payload detected inside emoji! (${inspection.hiddenByteCount} hidden bytes)`
                          : `Visual Emoji Cipher detected!`}
                      </span>
                    ) : (
                      <span>No secret stego bytes found. Make sure you copied the full emoji message.</span>
                    )}
                  </div>
                </div>

                {inputData && (
                  <button
                    onClick={handleClear}
                    className="shrink-0 text-[11px] text-neutral-500 hover:text-neutral-300 ml-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Passcode input (if needed) */}
            <div className="space-y-2 pt-2 border-t border-neutral-800/70">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Passcode / PIN (Agar sender ne lock lagaya tha)</span>
                </label>
                <span className="text-[11px] text-neutral-500">Optional</span>
              </div>

              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode if sender set one..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-emerald-500/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Decrypt Primary Action */}
            <button
              type="button"
              disabled={!inputData.trim() || isDecrypting}
              onClick={handleDecrypt}
              className={`w-full h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                inputData.trim() && !isDecrypting
                  ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 active:scale-[0.98] shadow-lg shadow-emerald-500/10'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isDecrypting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deciphering payload...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Reveal Secret Message</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Revealed Message & Privacy Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Revealed Plaintext
              </span>
              {revealedText && (
                <div className="flex items-center gap-2">
                  {isEncrypted && (
                    <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      AES-256 Verified
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Message Display Area */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 min-h-[160px] flex flex-col justify-between relative overflow-hidden">
              {revealedText ? (
                <div className="my-auto py-2">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Secret Unlocked:</span>
                  </div>
                  <div
                    className={`text-base sm:text-lg text-neutral-100 font-medium leading-relaxed whitespace-pre-wrap transition-all select-all ${
                      isMasked ? 'blur-md select-none' : ''
                    }`}
                  >
                    {displayAnimatedText || revealedText}
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center py-8 text-xs text-neutral-600">
                  Secret message will appear here after clicking "Reveal Secret Message".
                </div>
              )}

              {/* Burn Timer Progress Bar */}
              {burnTimerSec !== null && revealedText && (
                <div className="pt-3 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] text-amber-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      Self-destruct in {burnTimerSec}s
                    </span>
                    <button
                      onClick={() => {
                        setBurnTimerSec(null);
                        if (burnIntervalRef.current) clearInterval(burnIntervalRef.current);
                      }}
                      className="text-[10px] text-neutral-500 hover:text-neutral-300"
                    >
                      Cancel Timer
                    </button>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                      style={{
                        width: `${(burnTimerSec / burnTotalSec) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Privacy & Action Toolbar */}
            {revealedText && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyRevealed}
                    className="h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Secret</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.click();
                      setIsMasked(!isMasked);
                    }}
                    className="h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isMasked ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Unblur Text</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Blur (Hide)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Self-Destruct Burn Selector */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Burn Timer</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[15, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          sounds.click();
                          setBurnTotalSec(sec);
                          startBurnCountdown(sec);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                          burnTimerSec !== null && burnTotalSec === sec
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
