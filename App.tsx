
import React, { useState, useRef } from 'react';
import { Token, AppState } from './types';
import { DEFAULT_TOKENS, DEFAULT_GROUP_NAMES, SETTINGS_STORAGE_KEY } from './constants';
import { audioService } from './services/audioService';
import WheelSpinner from './components/WheelSpinner';
import SettingsModal from './components/SettingsModal';

interface PersistedSettings {
  tokens: Token[];
  groupNames: string[];
}

// Settings (slices + groups) persist across reloads so a user's customization
// isn't lost, but the actual game progress (picks) always starts fresh.
const loadSettings = (): PersistedSettings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tokens) && parsed.tokens.length > 0 &&
          Array.isArray(parsed.groupNames) && parsed.groupNames.length > 0) {
        return { tokens: parsed.tokens, groupNames: parsed.groupNames };
      }
    }
  } catch {
    // fall through to defaults
  }
  return { tokens: DEFAULT_TOKENS, groupNames: DEFAULT_GROUP_NAMES };
};

const saveSettings = (tokens: Token[], groupNames: string[]) => {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ tokens, groupNames }));
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
};

const App: React.FC = () => {
  const initialSettings = useRef(loadSettings());
  const [tokens, setTokens] = useState<Token[]>(initialSettings.current.tokens);
  const [groupNames, setGroupNames] = useState<string[]>(initialSettings.current.groupNames);

  // Always start with a fresh game state on reload as requested
  const [state, setState] = useState<AppState>({
    picks: [],
    currentGroupIndex: 0,
    availableTokenIds: initialSettings.current.tokens.map(t => t.id),
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastSelectedToken, setLastSelectedToken] = useState<Token | null>(null);
  const [flash, setFlash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Track the current rotation cumulatively to avoid resetting/snapping back
  const currentRotationRef = useRef(0);

  const totalGroups = groupNames.length;

  const spin = () => {
    if (isSpinning || state.currentGroupIndex >= totalGroups || showResultModal) return;

    // Filter tokens that haven't been picked yet to ensure no repetition
    const availableTokens = tokens.filter(t => state.availableTokenIds.includes(t.id));
    if (availableTokens.length === 0) return;

    audioService.startSpinMusic();
    setIsSpinning(true);
    setFlash(false);

    // Uniformly random selection among REMAINING tokens
    const chosenToken = availableTokens[Math.floor(Math.random() * availableTokens.length)];
    const tokenIndex = tokens.findIndex(t => t.id === chosenToken.id);
    
    const sliceWidth = 360 / tokens.length;
    const targetAngle = tokenIndex * sliceWidth + (sliceWidth / 2);
    
    // extraSpins for consistent speed feel
    const extraSpins = 8; 
    
    // Calculate new rotation based on current position to avoid "spin back"
    const normalizedCurrent = currentRotationRef.current % 360;
    const distanceToNext = (360 - normalizedCurrent) + (360 * extraSpins) - targetAngle - 90;
    const finalRotation = currentRotationRef.current + distanceToNext;

    currentRotationRef.current = finalRotation;
    setRotation(finalRotation);

    setTimeout(() => {
      onLand(chosenToken);
    }, 6000); 
  };

  const onLand = (token: Token) => {
    setIsSpinning(false);
    audioService.stopSpinMusic();
    audioService.playWin();
    setFlash(true);
    
    const win = window as any;
    if (win.confetti) {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };
        const fire = (particleRatio: number, opts: any) => {
          win.confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        };
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    setLastSelectedToken(token);
    setShowResultModal(true);
  };

  const handleContinue = () => {
    if (!lastSelectedToken) return;

    setState(prev => ({
      ...prev,
      picks: [...prev.picks, {
        groupName: groupNames[prev.currentGroupIndex],
        tokenLabel: lastSelectedToken.label,
        timestamp: Date.now()
      }],
      currentGroupIndex: prev.currentGroupIndex + 1,
      // Remove the chosen token from available pool for the next group
      availableTokenIds: prev.availableTokenIds.filter(id => id !== lastSelectedToken.id)
    }));
    
    setShowResultModal(false);
    setLastSelectedToken(null);
    setFlash(false);
  };

  const resetGameState = (nextTokens: Token[]) => {
    setState({
      picks: [],
      currentGroupIndex: 0,
      availableTokenIds: nextTokens.map(t => t.id),
    });
    currentRotationRef.current = 0;
    setRotation(0);
    setIsSpinning(false);
    setShowResultModal(false);
    setLastSelectedToken(null);
  };

  const reset = () => {
    if (window.confirm("Are you sure you want to reset all progress? This will clear all current group assignments.")) {
      resetGameState(tokens);
    }
  };

  const handleSaveSettings = (nextTokens: Token[], nextGroupNames: string[]) => {
    setTokens(nextTokens);
    setGroupNames(nextGroupNames);
    saveSettings(nextTokens, nextGroupNames);
    resetGameState(nextTokens);
    setShowSettings(false);
  };

  const isFinished = state.currentGroupIndex >= totalGroups;

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {flash && <div className="absolute inset-0 z-[60] pointer-events-none flash-overlay" />}

      <header className="py-2 px-6 border-b bg-white flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors normal-case tracking-normal font-semibold text-slate-500"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>
        <span>Proposal Section Selection</span>
        <span>Sections Allocation for Groups</span>
      </header>

      <main className="flex-grow flex flex-col md:flex-row bg-[#f8fafc]">
        
        <div className="flex-[3] flex flex-col items-center justify-between p-8 md:p-12 border-r bg-white">
          <div className="text-center">
            <h1 className="text-7xl font-black text-slate-900 mb-1">
              {isFinished ? "All Groups Assigned" : groupNames[state.currentGroupIndex]}
            </h1>
            <p className="text-indigo-400 font-black tracking-[0.2em] uppercase text-xs">
              {isFinished ? "Selection Complete" : "Next to Pick"}
            </p>
          </div>

          <div className="my-10">
            <WheelSpinner 
              isSpinning={isSpinning} 
              rotation={rotation} 
              tokens={tokens}
            />
          </div>

          <div className="w-full max-w-md">
            <button
              onClick={spin}
              disabled={isSpinning || isFinished || showResultModal}
              className={`w-full py-8 rounded-3xl font-bungee text-3xl tracking-widest transition-all transform duration-300 ${
                isSpinning || isFinished || showResultModal
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed scale-95' 
                : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200'
              }`}
            >
              {isSpinning ? 'SPINNING...' : isFinished ? 'FINISHED' : 'SPIN NOW'}
            </button>
          </div>
        </div>

        <div className="flex-[2] p-8 md:p-12 overflow-y-auto max-h-screen flex flex-col">
            <div className="flex-grow max-w-md mx-auto w-full space-y-4">
                {groupNames.map((name, idx) => {
                    const pick = state.picks.find(p => p.groupName === name);
                    const isActive = state.currentGroupIndex === idx;
                    const isCompleted = idx < state.currentGroupIndex;
                    const token = pick ? tokens.find(t => t.label === pick.tokenLabel) : null;

                    return (
                        <div 
                            key={`${name}-${idx}`}
                            className={`relative flex items-center p-6 rounded-[2.5rem] border-2 transition-all duration-300 ${
                                isActive ? 'bg-white border-indigo-500 active-group-glow z-10' : 
                                isCompleted ? 'bg-white/50 border-slate-100 opacity-100' : 'bg-transparent border-transparent opacity-40'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-6 ${
                                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {idx + 1}
                            </div>
                            
                            <div className="flex-grow">
                                <h3 className={`font-bold text-xl ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{name}</h3>
                                {isActive && <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-0.5">Up to Spin</p>}
                                {!isActive && !isCompleted && <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest mt-0.5">Queued</p>}
                                {isCompleted && <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">Completed</p>}
                            </div>

                            {pick && token && (
                                <div 
                                    className="px-6 py-2 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-lg transform hover:scale-105 transition-transform"
                                    style={{ backgroundColor: token.color }}
                                >
                                    {token.label}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-12 pt-8 border-t flex justify-center max-w-md mx-auto w-full">
                <button 
                  onClick={reset}
                  className="px-8 py-4 rounded-2xl bg-slate-200 text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 transition-all text-xs uppercase tracking-widest"
                >
                  Manual Reset
                </button>
            </div>
        </div>
      </main>

      {showResultModal && lastSelectedToken && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl animate-result">
                <div className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] mb-4">You have won:</div>
                <div 
                    className="text-5xl font-bungee mb-10 transition-colors duration-500 animate-shimmer"
                    style={{ color: lastSelectedToken.color }}
                >
                    {lastSelectedToken.label}
                </div>
                <button
                    onClick={handleContinue}
                    className="w-full py-6 rounded-3xl bg-indigo-600 text-white font-bungee text-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                >
                    Continue
                </button>
            </div>
        </div>
      )}

      <SettingsModal
        isOpen={showSettings}
        initialTokens={tokens}
        initialGroupNames={groupNames}
        onCancel={() => setShowSettings(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
