import { getAdminConfig, updateAdminConfig } from './adminStorage';
import { AdminConfig } from '../types';

export const getTrialDays = (): number => {
  const config = getAdminConfig();
  return config.trialDays || 7;
};

export const isTrialEnabled = (): boolean => {
  const config = getAdminConfig();
  return config.trialEnabled !== false; // Default to true if not set
};

export const getTrialConfig = (): AdminConfig => {
  return getAdminConfig();
};

export const updateTrialConfig = (updates: Partial<AdminConfig>): void => {
  updateAdminConfig(updates);
};

export const disableTrial = (): void => {
  updateAdminConfig({
    trialEnabled: false
  });
};

export const enableTrial = (): void => {
  updateAdminConfig({
    trialEnabled: true
  });
};

export const setTrialDays = (days: number): void => {
  if (days < 0 || days > 365) {
    throw new Error('Trial days must be between 0 and 365');
  }
  
  updateAdminConfig({
    trialDays: days
  });
};

