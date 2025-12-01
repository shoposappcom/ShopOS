/**
 * UUID Generation Utility
 * Provides standardized UUID generation for Supabase migration compatibility
 */

/**
 * Generate a UUID v4 compatible string
 * For Supabase migration, use this instead of Date.now() based IDs
 */
export function generateUUID(): string {
  // Simple UUID v4 implementation
  // In production, consider using crypto.randomUUID() if available
  // or a library like 'uuid'
  
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a prefixed ID for backward compatibility
 * Use this when migrating existing ID generation code
 */
export function generatePrefixedID(prefix: string): string {
  return `${prefix}_${generateUUID()}`;
}

/**
 * Legacy ID generator (for backward compatibility)
 * @deprecated Use generateUUID() or generatePrefixedID() instead
 */
export function generateLegacyID(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Migration helper: Convert legacy ID to UUID if needed
 */
export function normalizeID(id: string, prefix?: string): string {
  // If already a UUID, return as-is
  if (isValidUUID(id)) {
    return id;
  }
  
  // If it's a legacy ID and we have a prefix, generate new UUID
  // Otherwise, return as-is (for migration period)
  if (prefix && id.startsWith(prefix)) {
    return generateUUID();
  }
  
  return id;
}

