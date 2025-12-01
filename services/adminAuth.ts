import { verifyAdminPassword, updateAdminPassword } from './adminStorage';

export interface AdminAuthResult {
  success: boolean;
  error?: string;
}

export const authenticateAdmin = async (username: string, password: string): Promise<AdminAuthResult> => {
  if (!username || !password) {
    return {
      success: false,
      error: 'Username and password are required'
    };
  }
  
  const isValid = await verifyAdminPassword(username, password);
  
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid username or password'
    };
  }
  
  // Store admin session in localStorage
  const session = {
    username,
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  
  localStorage.setItem('shopos_admin_session', JSON.stringify(session));
  
  return {
    success: true
  };
};

export const isAdminAuthenticated = (): boolean => {
  const sessionStr = localStorage.getItem('shopos_admin_session');
  
  if (!sessionStr) {
    return false;
  }
  
  try {
    const session = JSON.parse(sessionStr);
    const expiresAt = new Date(session.expiresAt);
    
    // Check if session has expired
    if (new Date() > expiresAt) {
      localStorage.removeItem('shopos_admin_session');
      return false;
    }
    
    return true;
  } catch {
    localStorage.removeItem('shopos_admin_session');
    return false;
  }
};

export const logoutAdmin = (): void => {
  localStorage.removeItem('shopos_admin_session');
};

export const changeAdminPassword = async (currentPassword: string, newPassword: string): Promise<AdminAuthResult> => {
  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: 'New password must be at least 8 characters'
    };
  }
  
  // Update password (this function verifies current password internally)
  const success = await updateAdminPassword(currentPassword, newPassword);
  
  if (!success) {
    return {
      success: false,
      error: 'Current password is incorrect'
    };
  }
  
  return {
    success: true
  };
};

export const getAdminSession = (): { username: string; authenticatedAt: string } | null => {
  const sessionStr = localStorage.getItem('shopos_admin_session');
  
  if (!sessionStr) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionStr);
    const expiresAt = new Date(session.expiresAt);
    
    if (new Date() > expiresAt) {
      return null;
    }
    
    return {
      username: session.username,
      authenticatedAt: session.authenticatedAt
    };
  } catch {
    return null;
  }
};

