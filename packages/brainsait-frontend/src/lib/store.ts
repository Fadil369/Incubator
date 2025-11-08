/**
 * Global State Management with Zustand
 * Handles authentication, user data, and application state
 *
 * @author BrainSAIT Platform
 * @version 1.0.0
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginRequest, SMEProfile, MentorProfile } from '@brainsait/shared/types/user.types';
import authService, { RegisterRequest } from '../services/authService';

/**
 * Authentication State Interface
 */
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

/**
 * Application State Interface
 */
interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  direction: 'rtl' | 'ltr';

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'ar' | 'en') => void;
  addNotification: (notification: { type: string; message: string }) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

/**
 * SME Profile State Interface
 */
interface SMEState {
  smeProfile: SMEProfile | null;
  isLoading: boolean;
  error: string | null;

  setSMEProfile: (profile: SMEProfile | null) => void;
  clearSMEProfile: () => void;
}

/**
 * Mentor Profile State Interface
 */
interface MentorState {
  mentorProfile: MentorProfile | null;
  isLoading: boolean;
  error: string | null;

  setMentorProfile: (profile: MentorProfile | null) => void;
  clearMentorProfile: () => void;
}

/**
 * Authentication Store
 * Handles user authentication state and operations
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      // Login action
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Register action
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Even if logout fails on server, clear local state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Refresh user data
      refreshUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to refresh user',
            isLoading: false,
          });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set user directly
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Application Store
 * Handles global application state
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      theme: 'light',
      language: 'ar',
      direction: 'rtl',
      notifications: [],

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      // Theme actions
      setTheme: (theme: 'light' | 'dark') => set({ theme }),

      // Language actions
      setLanguage: (language: 'ar' | 'en') =>
        set({
          language,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }),

      // Notification actions
      addNotification: (notification: { type: string; message: string }) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              id: Date.now().toString(),
              type: notification.type as 'success' | 'error' | 'warning' | 'info',
              message: notification.message,
              timestamp: new Date(),
            },
          ],
        })),

      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        direction: state.direction,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

/**
 * SME Profile Store
 * Handles SME profile state
 */
export const useSMEStore = create<SMEState>()(
  persist(
    (set) => ({
      // Initial state
      smeProfile: null,
      isLoading: false,
      error: null,

      // Actions
      setSMEProfile: (profile: SMEProfile | null) => set({ smeProfile: profile }),
      clearSMEProfile: () => set({ smeProfile: null }),
    }),
    {
      name: 'sme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Mentor Profile Store
 * Handles mentor profile state
 */
export const useMentorStore = create<MentorState>()(
  persist(
    (set) => ({
      // Initial state
      mentorProfile: null,
      isLoading: false,
      error: null,

      // Actions
      setMentorProfile: (profile: MentorProfile | null) => set({ mentorProfile: profile }),
      clearMentorProfile: () => set({ mentorProfile: null }),
    }),
    {
      name: 'mentor-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Initialize authentication from stored data
 * Call this on app load to restore session
 */
export const initializeAuth = () => {
  const { user, token } = useAuthStore.getState();

  if (token && user) {
    authService.setToken(token);
  } else {
    // Try to restore from authService storage
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      useAuthStore.setState({
        user: storedUser,
        isAuthenticated: true,
      });
    }
  }
};

// Export all stores
export default {
  useAuthStore,
  useAppStore,
  useSMEStore,
  useMentorStore,
  initializeAuth,
};
