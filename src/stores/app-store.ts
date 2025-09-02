import { create } from 'zustand';

// Define the state structure
interface AppState {
  currentAccountName: string | null;
  setCurrentAccountName: (name: string | null) => void;
  clearCurrentAccountName: () => void;

  // Add new state for investment accounts
  currentInvestmentAccountName: string | null;
  setCurrentInvestmentAccountName: (name: string | null) => void;
  clearCurrentInvestmentAccountName: () => void;
}

/**
 * A global store for ephemeral UI state that needs to be shared across components.
 */
export const useAppStore = create<AppState>((set) => ({
  // State for regular accounts
  currentAccountName: null,

  // Actions for regular accounts
  setCurrentAccountName: (name) => set({ currentAccountName: name }),
  clearCurrentAccountName: () => set({ currentAccountName: null }),

  // State for investment accounts
  currentInvestmentAccountName: null,

  // Actions for investment accounts
  setCurrentInvestmentAccountName: (name) => set({ currentInvestmentAccountName: name }),
  clearCurrentInvestmentAccountName: () => set({ currentInvestmentAccountName: null })
}));
