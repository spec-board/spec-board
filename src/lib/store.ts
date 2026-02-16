import { create } from 'zustand';
import type { Project, Feature, FocusState } from '@/types';

interface ProjectStore {
  // State
  project: Project | null;
  selectedFeature: Feature | null;
  isLoading: boolean;
  error: string | null;
  projectPath: string | null;
  // Keyboard navigation focus state (FR-008)
  focusState: FocusState;

  // Actions
  setProject: (project: Project | null) => void;
  setSelectedFeature: (feature: Feature | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectPath: (path: string | null) => void;
  // Focus state actions
  setFocusState: (state: Partial<FocusState>) => void;
  clearFocusState: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  selectedFeature: null,
  isLoading: false,
  error: null,
  projectPath: null,
  // Initial focus state (no focus)
  focusState: {
    column: null,
    cardIndex: null,
    featureId: null,
  },

  setProject: (project) => set({ project, error: null }),

  setSelectedFeature: (feature) => set({ selectedFeature: feature }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setProjectPath: (projectPath) => set({ projectPath }),

  // Focus state actions (FR-008)
  setFocusState: (state) =>
    set((prev) => ({
      focusState: { ...prev.focusState, ...state },
    })),

  clearFocusState: () =>
    set({
      focusState: {
        column: null,
        cardIndex: null,
        featureId: null,
      },
    }),
}));
