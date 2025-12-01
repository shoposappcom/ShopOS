const TIME_ANCHOR_KEY = 'shopos_time_anchors';
const MAX_BACKWARD_TIME_JUMP = -3600000; // 1 hour in milliseconds (allow some tolerance for clock adjustments)

export interface TimeAnchor {
  timestamp: number; // Unix timestamp in milliseconds
  date: string; // ISO date string
  createdAt: number; // When this anchor was created
}

export const initializeTimeAnchors = (): void => {
  const now = Date.now();
  const anchors: TimeAnchor[] = [
    {
      timestamp: now,
      date: new Date().toISOString(),
      createdAt: now
    }
  ];
  
  localStorage.setItem(TIME_ANCHOR_KEY, JSON.stringify(anchors));
};

export const addTimeAnchor = (): void => {
  const existing = getTimeAnchors();
  const now = Date.now();
  
  const newAnchor: TimeAnchor = {
    timestamp: now,
    date: new Date().toISOString(),
    createdAt: now
  };
  
  // Keep only last 10 anchors
  const updated = [...existing, newAnchor].slice(-10);
  localStorage.setItem(TIME_ANCHOR_KEY, JSON.stringify(updated));
};

export const getTimeAnchors = (): TimeAnchor[] => {
  const stored = localStorage.getItem(TIME_ANCHOR_KEY);
  if (!stored) {
    initializeTimeAnchors();
    return getTimeAnchors();
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    initializeTimeAnchors();
    return getTimeAnchors();
  }
};

export const validateTimeIntegrity = (): { isValid: boolean; reason?: string } => {
  const anchors = getTimeAnchors();
  
  if (anchors.length === 0) {
    initializeTimeAnchors();
    return { isValid: true };
  }
  
  const now = Date.now();
  const lastAnchor = anchors[anchors.length - 1];
  
  // Check if time went backwards significantly
  const timeDiff = now - lastAnchor.timestamp;
  
  if (timeDiff < MAX_BACKWARD_TIME_JUMP) {
    return {
      isValid: false,
      reason: `Time manipulation detected: system time moved backward by ${Math.abs(timeDiff / 1000 / 60)} minutes`
    };
  }
  
  // Check for suspicious patterns (multiple backward jumps)
  let backwardJumps = 0;
  for (let i = 1; i < anchors.length; i++) {
    const diff = anchors[i].timestamp - anchors[i - 1].timestamp;
    if (diff < MAX_BACKWARD_TIME_JUMP) {
      backwardJumps++;
    }
  }
  
  if (backwardJumps > 2) {
    return {
      isValid: false,
      reason: 'Multiple time manipulation attempts detected'
    };
  }
  
  // Check for suspicious forward jumps (system clock set forward to extend trial)
  // Allow up to 1 hour forward (for timezone adjustments), but flag larger jumps
  const MAX_FORWARD_TIME_JUMP = 24 * 60 * 60 * 1000; // 24 hours
  if (timeDiff > MAX_FORWARD_TIME_JUMP) {
    return {
      isValid: false,
      reason: `Suspicious time jump detected: system time moved forward by ${Math.abs(timeDiff / 1000 / 60 / 60)} hours`
    };
  }
  
  // Add new anchor periodically (every 5 minutes)
  const timeSinceLastAnchor = now - lastAnchor.timestamp;
  if (timeSinceLastAnchor > 5 * 60 * 1000) {
    addTimeAnchor();
  }
  
  return { isValid: true };
};

export const getLastKnownTime = (): number => {
  const anchors = getTimeAnchors();
  if (anchors.length === 0) {
    return Date.now();
  }
  return anchors[anchors.length - 1].timestamp;
};

