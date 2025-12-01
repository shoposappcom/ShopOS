/**
 * View Mode Utilities
 * Shared utilities for managing view modes across different pages
 * Now uses Supabase for persistence instead of localStorage
 */

import { isOnline } from '../services/supabase/client';
import * as db from '../services/supabase/database';

export type ViewMode = 'small' | 'large' | 'list' | 'details';

export const DEFAULT_VIEW_MODE: ViewMode = 'large';

/**
 * Get preference key for a specific page
 */
export function getViewModePreferenceKey(pageId: string): string {
  return `${pageId}_view_mode`;
}

/**
 * Load view mode from Supabase (with localStorage fallback)
 */
export async function loadViewMode(
  pageId: string,
  shopId?: string,
  userId?: string
): Promise<ViewMode> {
  // Try Supabase first if we have shopId and userId
  if (shopId && userId && isOnline()) {
    try {
      const preferenceKey = getViewModePreferenceKey(pageId);
      const value = await db.getUserPreference(shopId, userId, preferenceKey);
      if (value && ['small', 'large', 'list', 'details'].includes(value)) {
        return value as ViewMode;
      }
    } catch (error) {
      console.error('Error loading view mode from Supabase:', error);
    }
  }
  
  // Fallback to localStorage for backward compatibility
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `shopos_${pageId}_view_mode`;
      const stored = localStorage.getItem(storageKey);
      if (stored && ['small', 'large', 'list', 'details'].includes(stored)) {
        return stored as ViewMode;
      }
    } catch (error) {
      console.error('Error loading view mode from localStorage:', error);
    }
  }
  
  return DEFAULT_VIEW_MODE;
}

/**
 * Save view mode to Supabase (with localStorage fallback)
 */
export async function saveViewMode(
  pageId: string,
  viewMode: ViewMode,
  shopId?: string,
  userId?: string
): Promise<void> {
  // Save to Supabase if we have shopId and userId
  if (shopId && userId && isOnline()) {
    try {
      const preferenceKey = getViewModePreferenceKey(pageId);
      await db.setUserPreference(shopId, userId, preferenceKey, viewMode);
    } catch (error) {
      console.error('Error saving view mode to Supabase:', error);
    }
  }
  
  // Also save to localStorage as backup
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `shopos_${pageId}_view_mode`;
      localStorage.setItem(storageKey, viewMode);
    } catch (error) {
      console.error('Error saving view mode to localStorage:', error);
    }
  }
}

/**
 * Page IDs for localStorage keys
 */
export const PAGE_IDS = {
  POS: 'pos',
  STOCK: 'stock',
  DEBTORS: 'debtors',
  GIFT_CARDS: 'giftcards',
} as const;

