
export interface Token {
  id: string;
  label: string;
  color: string;
}

export interface PickRecord {
  groupName: string;
  tokenLabel: string;
  timestamp: number;
}

export interface AppState {
  picks: PickRecord[];
  currentGroupIndex: number;
  availableTokenIds: string[];
}
