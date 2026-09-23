import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabKey } from './components/Header';
import { Encoder } from './components/Encoder';
import { Decoder } from './components/Decoder';
import { ChatSimulator } from './components/ChatSimulator';
import { StegoInspector } from './components/StegoInspector';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ClipboardPrompt } from './components/ClipboardPrompt';
import { sounds } from './lib/audio';
import { inspectPayload } from './lib/crypto';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('encrypt');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cross-tab transfer state
  const [decoderTransferPayload, setDecoderTransferPayload] = useState('');
  const [decoderTransferPasscode, setDecoderTransferPasscode] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Clipboard detected prompt state
  const [clipboardPrompt, setClipboardPrompt] = useState<{
    payload: string;
    emoji: string;
  } | null>(null);

  const addToast = useCallback(
    (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 6);
      setToasts((prev) => [...prev.slice(-3), { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Panic Clear Handler (Esc shortcut)
  const handlePanicClear = useCallback(() => {
    sounds.click();
    setDecoderTransferPayload('');
    setDecoderTransferPasscode('');
    setClipboardPrompt(null);
    addToast('Panic Wipe: Session state & message cache purged.', 'warning');
  }, [addToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handlePanicClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePanicClear]);

  // Check for incoming URL hash payload on load (e.g. #m=...&e=...)
  useEffect(() => {
    const handleUrlPayload = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const search = window.location.search;
      const fullQuery = hash || search;

      if (fullQuery && (fullQuery.includes('m=') || fullQuery.includes('data='))) {
        setDecoderTransferPayload(window.location.href);
        setActiveTab('decrypt');
        addToast('⚡ Instant Emoji Link detected! Decoding message...', 'info');
      }
    };

    handleUrlPayload();
    window.addEventListener('hashchange', handleUrlPayload);
    return () => window.removeEventListener('hashchange', handleUrlPayload);
  }, [addToast]);

  // Check user clipboard upon opening the app / window focus
  const checkClipboardForPayload = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.readText) {
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) return;

      const inspection = inspectPayload(text);
      if (inspection.hasPayload && inspection.rawPayload) {
        // If we are already on decrypt with this same payload, ignore
        if (decoderTransferPayload === text.trim() || decoderTransferPayload === inspection.rawPayload) {
          return;
        }

        setClipboardPrompt({
          payload: text.trim(),
          emoji: inspection.coverEmoji || '✨',
        });
        sounds.lock();
      }
    } catch {
      // Browser may block clipboard access without explicit user interaction; harmless
    }
  }, [decoderTransferPayload]);

  useEffect(() => {
    // Attempt check on mount
    checkClipboardForPayload();

    // Check again when user switches back to this tab (window focus)
    const onFocus = () => {
      checkClipboardForPayload();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkClipboardForPayload]);

  const handleSendToDecoder = (payload: string, passcode?: string) => {
    setDecoderTransferPayload(payload);
    setDecoderTransferPasscode(passcode || '');
    setActiveTab('decrypt');
  };

  const handleAcceptClipboard = (payload: string) => {
    setClipboardPrompt(null);
    handleSendToDecoder(payload);
    addToast('Clipboard sequence sent to decoder!', 'success');
  };

  const handleDismissClipboard = () => {
    setClipboardPrompt(null);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-neutral-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Bar Contract (Single row, 3-zone per frontend design rules) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPanicClear={handlePanicClear}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main Viewport Container (CSS-hidden to preserve state between tab switches!) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={activeTab === 'encrypt' ? 'block' : 'hidden'}>
          <Encoder
            onSendToDecoder={handleSendToDecoder}
            onToast={addToast}
          />
        </div>

        <div className={activeTab === 'decrypt' ? 'block' : 'hidden'}>
          <Decoder
            initialPayload={decoderTransferPayload}
            initialPasscode={decoderTransferPasscode}
            onToast={addToast}
          />
        </div>

        <div className={activeTab === 'simulator' ? 'block' : 'hidden'}>
          <ChatSimulator
            onToast={addToast}
            onJumpToEncrypt={() => {
              sounds.click();
              setActiveTab('encrypt');
            }}
          />
        </div>

        <div className={activeTab === 'inspector' ? 'block' : 'hidden'}>
          <StegoInspector />
        </div>
      </main>

      {/* Clean Unboxed Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/70 py-6 text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">EmojiCloak</span>
            <span>·</span>
            <span>Client-Side Steganography & Cipher Suite</span>
            <span>·</span>
            <span>Zero Server Transit</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => {
                sounds.click();
                setActiveTab('simulator');
              }}
              className="hover:text-emerald-400 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                sounds.click();
                setActiveTab('inspector');
              }}
              className="hover:text-emerald-400 transition-colors"
            >
              Technical Specs
            </button>
            <button
              onClick={handlePanicClear}
              className="hover:text-red-400 transition-colors"
            >
              Panic Wipe (Esc)
            </button>
          </div>
        </div>
      </footer>

      {/* Clipboard detection prompt banner */}
      {clipboardPrompt && (
        <ClipboardPrompt
          detectedPayload={clipboardPrompt.payload}
          detectedEmoji={clipboardPrompt.emoji}
          onAccept={handleAcceptClipboard}
          onDismiss={handleDismissClipboard}
        />
      )}

      {/* Floating Toast Alert Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
