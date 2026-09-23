import React from 'react';
import { Sparkles, ArrowRight, X, ShieldAlert, KeyRound } from 'lucide-react';
import { sounds } from '../lib/audio';

interface ClipboardPromptProps {
  detectedPayload: string;
  detectedEmoji: string;
  onAccept: (payload: string) => void;
  onDismiss: () => void;
}

export const ClipboardPrompt: React.FC<ClipboardPromptProps> = ({
  detectedPayload,
  detectedEmoji,
  onAccept,
  onDismiss,
}) => {
  const handleDecode = () => {
    sounds.unlock();
    onAccept(detectedPayload);
  };

  const handleClose = () => {
    sounds.click();
    onDismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="pointer-events-auto max-w-lg w-full bg-neutral-900/95 backdrop-blur-xl border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-emerald-500/20 text-neutral-100 relative">
        <button
          onClick={handleClose}
          aria-label="Dismiss clipboard prompt"
          className="absolute top-3 right-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-2xl shadow-inner">
            {detectedEmoji || '✨'}
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>EmojiCloak Sequence Detected in Clipboard!</span>
            </div>
            <p className="text-sm font-medium text-neutral-200 mt-1 leading-snug">
              Aapke clipboard me ek hidden secret emoji payload mila hai. Kya aap ise abhi decode karna chahte hain?
            </p>
            <div className="mt-2 text-[11px] text-neutral-400 font-mono truncate max-w-xs sm:max-w-sm bg-neutral-950/80 px-2.5 py-1 rounded-lg border border-neutral-800">
              {detectedPayload.slice(0, 50)}...
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-xl hover:bg-neutral-800/80 transition-colors"
          >
            Nahi, Ignore Karein
          </button>
          <button
            type="button"
            onClick={handleDecode}
            className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <span>Decode & Reveal Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
