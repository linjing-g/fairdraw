
import { Token } from './types';

// Default slices shown the very first time the app is opened.
// Users can add/remove/edit these at any time from the Settings panel.
export const DEFAULT_TOKENS: Token[] = [
  { id: 'intro', label: 'Introduction', color: '#ec4899' }, // Pink 500
  { id: 'obj', label: 'Objectives & Deployment', color: '#8b5cf6' }, // Violet 500
  { id: 'fa', label: 'Feasibility (A)', color: '#06b6d4' }, // Cyan 500
  { id: 'fb', label: 'Feasibility (B)', color: '#10b981' }, // Emerald 500
  { id: 'ia', label: 'Impact (A)', color: '#f59e0b' }, // Amber 500
  { id: 'ib', label: 'Impact (B)', color: '#ef4444' }, // Red 500
];

// Default groups shown the very first time the app is opened.
export const DEFAULT_GROUP_NAMES: string[] = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6'];

// Palette cycled through automatically when a new slice is added in Settings.
export const COLOR_PALETTE: string[] = [
  '#ec4899', // Pink 500
  '#8b5cf6', // Violet 500
  '#06b6d4', // Cyan 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ef4444', // Red 500
  '#3b82f6', // Blue 500
  '#84cc16', // Lime 500
  '#f97316', // Orange 500
  '#14b8a6', // Teal 500
  '#a855f7', // Purple 500
  '#eab308', // Yellow 500
];

export const STORAGE_KEY = 'classroom_picker_state_v1';
export const SETTINGS_STORAGE_KEY = 'classroom_picker_settings_v1';
