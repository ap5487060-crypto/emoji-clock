import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles } from 'lucide-react';
import { sounds } from '../lib/audio';

export type TabKey = 'encrypt' | 'decrypt' | 'simulator' | 'inspector';

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  onPanicClear: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onPanicClear,
  soundEnabled,
  setSoundEnabled,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.click();
  };

  const handleTabClick = (tab: TabKey) => {
    sounds.click();
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single text element per rule) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleTabClick('encrypt')}
            className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <span className="text-xl">🤫</span>
            <span>EmojiCloak</span>
          </button>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => handleTabClick('encrypt')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'encrypt'
                ? 'border-emerald-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create Secret Emoji
          </button>
          <button
            onClick={() => handleTabClick('decrypt')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'decrypt'
                ? 'border-emerald-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Revealed Message
          </button>
          <button
            onClick={() => handleTabClick('simulator')}
            className={`transition-colors pb-1 border-b-2 whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'border-emerald-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            WhatsApp Preview
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Toggle sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          <button
            onClick={onPanicClear}
            title="Panic wipe (Esc): Instantly purge all messages, clipboard and memory"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700/70 hover:border-red-500/50 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all min-h-[40px]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400" />
            <span className="hidden sm:inline">Panic Wipe</span>
            <kbd className="hidden lg:inline text-[10px] text-neutral-500 font-mono px-1 py-0.5 bg-neutral-800 rounded">
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* Mobile Tab Strip */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800/60 bg-neutral-950 px-2 py-1 text-xs">
        <button
          onClick={() => handleTabClick('encrypt')}
          className={`px-3 py-2 font-medium transition-colors ${
            activeTab === 'encrypt' ? 'text-emerald-400 border-b border-emerald-400' : 'text-neutral-400'
          }`}
        >
          Create Emoji
        </button>
        <button
          onClick={() => handleTabClick('decrypt')}
          className={`px-3 py-2 font-medium transition-colors ${
            activeTab === 'decrypt' ? 'text-emerald-400 border-b border-emerald-400' : 'text-neutral-400'
          }`}
        >
          Revealed
        </button>
        <button
          onClick={() => handleTabClick('simulator')}
          className={`px-3 py-2 font-medium transition-colors ${
            activeTab === 'simulator' ? 'text-emerald-400 border-b border-emerald-400' : 'text-neutral-400'
          }`}
        >
          WhatsApp Demo
        </button>
      </div>
    </header>
  );
};
