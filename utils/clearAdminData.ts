/**
 * Utility to clear admin credentials from localStorage
 * Use this if you need to reset admin setup
 */

export const clearAdminCredentials = (): void => {
  const ADMIN_STORAGE_KEY = 'shopos_admin_data';
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Remove admin credentials but keep other data
      parsed.adminCredentials = undefined;
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(parsed));
      console.log('✅ Admin credentials cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear admin credentials:', error);
    }
  }
  
  // Also clear admin session
  localStorage.removeItem('shopos_admin_session');
  console.log('✅ Admin session cleared');
};

// Run this in browser console to reset: clearAdminCredentials()

