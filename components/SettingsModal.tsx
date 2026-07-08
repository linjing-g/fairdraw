
import React, { useEffect, useState } from 'react';
import { Token } from '../types';
import { COLOR_PALETTE } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  initialTokens: Token[];
  initialGroupNames: string[];
  onCancel: () => void;
  onSave: (tokens: Token[], groupNames: string[]) => void;
}

const slugify = (label: string, index: number) => {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'slice'}-${index}-${Date.now().toString(36)}`;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  initialTokens,
  initialGroupNames,
  onCancel,
  onSave,
}) => {
  const [draftTokens, setDraftTokens] = useState<Token[]>(initialTokens);
  const [draftGroups, setDraftGroups] = useState<string[]>(initialGroupNames);
  const [error, setError] = useState<string | null>(null);

  // Reset the draft every time the modal is opened, so stale edits from a
  // previously-cancelled session don't leak in.
  useEffect(() => {
    if (isOpen) {
      setDraftTokens(initialTokens);
      setDraftGroups(initialGroupNames);
      setError(null);
    }
  }, [isOpen, initialTokens, initialGroupNames]);

  if (!isOpen) return null;

  const updateSliceLabel = (index: number, label: string) => {
    setDraftTokens(prev => prev.map((t, i) => (i === index ? { ...t, label } : t)));
  };

  const updateSliceColor = (index: number, color: string) => {
    setDraftTokens(prev => prev.map((t, i) => (i === index ? { ...t, color } : t)));
  };

  const addSlice = () => {
    setDraftTokens(prev => {
      const nextIndex = prev.length;
      const color = COLOR_PALETTE[nextIndex % COLOR_PALETTE.length];
      const label = `Section ${nextIndex + 1}`;
      return [...prev, { id: slugify(label, nextIndex), label, color }];
    });
  };

  const removeSlice = (index: number) => {
    setDraftTokens(prev => prev.filter((_, i) => i !== index));
  };

  const updateGroupName = (index: number, name: string) => {
    setDraftGroups(prev => prev.map((g, i) => (i === index ? name : g)));
  };

  const addGroup = () => {
    setDraftGroups(prev => [...prev, `Group ${prev.length + 1}`]);
  };

  const removeGroup = (index: number) => {
    setDraftGroups(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const cleanedTokens = draftTokens
      .map((t, i) => ({ ...t, label: t.label.trim() || `Section ${i + 1}` }));
    const cleanedGroups = draftGroups
      .map((g, i) => g.trim() || `Group ${i + 1}`);

    if (cleanedTokens.length === 0) {
      setError('Add at least one slice to the pie.');
      return;
    }
    if (cleanedGroups.length === 0) {
      setError('Add at least one group.');
      return;
    }

    onSave(cleanedTokens, cleanedGroups);
  };

  const tooManyGroups = draftGroups.length > draftTokens.length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-8 py-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Settings</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1">
              Customize slices &amp; groups
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors flex items-center justify-center text-xl font-bold"
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Slices column */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                Pie Slices ({draftTokens.length})
              </h3>
            </div>
            <div className="space-y-3">
              {draftTokens.map((token, index) => (
                <div key={token.id} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={token.color}
                    onChange={e => updateSliceColor(index, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                    aria-label={`Color for slice ${index + 1}`}
                  />
                  <input
                    type="text"
                    value={token.label}
                    onChange={e => updateSliceLabel(index, e.target.value)}
                    placeholder={`Section ${index + 1}`}
                    className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => removeSlice(index)}
                    disabled={draftTokens.length <= 1}
                    className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center font-bold"
                    aria-label={`Remove slice ${index + 1}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addSlice}
              className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
              + Add Slice
            </button>
          </div>

          {/* Groups column */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                Groups ({draftGroups.length})
              </h3>
            </div>
            <div className="space-y-3">
              {draftGroups.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 font-bold text-sm flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => updateGroupName(index, e.target.value)}
                    placeholder={`Group ${index + 1}`}
                    className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => removeGroup(index)}
                    disabled={draftGroups.length <= 1}
                    className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center font-bold"
                    aria-label={`Remove ${name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addGroup}
              className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
              + Add Group
            </button>

            {tooManyGroups && (
              <p className="mt-4 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                You have more groups than slices, so at least one group won't get a
                pick unless you add more slices.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="px-8 text-xs font-bold text-red-500 text-center">{error}</div>
        )}

        <div className="px-8 py-6 border-t flex items-center justify-between gap-4">
          <p className="text-[10px] text-slate-400 leading-snug max-w-xs">
            Saving will reset all current picks so the wheel and group list stay in sync
            with your changes.
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Save &amp; Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
