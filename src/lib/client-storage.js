'use client';

// Client-side storage utility for persisting user actions
// Uses localStorage to persist follows, purchases, and subscriptions

/**
 * Get user data from localStorage
 * @param {string} userId - Current user ID
 * @returns {Object} User storage data
 */
function getUserData(userId) {
  if (typeof window === 'undefined') return {};
  
  try {
    const data = localStorage.getItem(`onlyfarms_user_${userId}`);
    return data ? JSON.parse(data) : {
      follows: [],
      purchases: [],
      subscriptions: []
    };
  } catch (error) {
    console.error('Error reading user data from localStorage:', error);
    return {
      follows: [],
      purchases: [],
      subscriptions: []
    };
  }
}

/**
 * Save user data to localStorage
 * @param {string} userId - Current user ID
 * @param {Object} data - Data to save
 */
function saveUserData(userId, data) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`onlyfarms_user_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
  }
}

/**
 * Check if user is following a creator
 * @param {string} userId - Current user ID
 * @param {string} creatorId - Creator ID to check
 * @returns {boolean} True if following
 */
export function isFollowing(userId, creatorId) {
  if (!userId || !creatorId) return false;
  const userData = getUserData(userId);
  return userData.follows.includes(creatorId);
}

/**
 * Toggle follow status for a creator
 * @param {string} userId - Current user ID
 * @param {string} creatorId - Creator ID to toggle
 * @returns {boolean} New follow status
 */
export function toggleFollow(userId, creatorId) {
  if (!userId || !creatorId) return false;
  
  const userData = getUserData(userId);
  const isCurrentlyFollowing = userData.follows.includes(creatorId);
  
  if (isCurrentlyFollowing) {
    userData.follows = userData.follows.filter(id => id !== creatorId);
  } else {
    userData.follows.push(creatorId);
  }
  
  saveUserData(userId, userData);
  return !isCurrentlyFollowing;
}

/**
 * Check if user has purchased content
 * @param {string} userId - Current user ID
 * @param {string} contentId - Content ID to check
 * @returns {boolean} True if purchased
 */
export function hasPurchased(userId, contentId) {
  if (!userId || !contentId) return false;
  const userData = getUserData(userId);
  return userData.purchases.includes(contentId);
}

/**
 * Add a content purchase
 * @param {string} userId - Current user ID
 * @param {string} contentId - Content ID purchased
 */
export function addPurchase(userId, contentId) {
  if (!userId || !contentId) return;
  
  const userData = getUserData(userId);
  if (!userData.purchases.includes(contentId)) {
    userData.purchases.push(contentId);
    saveUserData(userId, userData);
  }
}

/**
 * Check if user is subscribed to a creator
 * @param {string} userId - Current user ID
 * @param {string} creatorId - Creator ID to check
 * @returns {boolean} True if subscribed
 */
export function isSubscribed(userId, creatorId) {
  if (!userId || !creatorId) return false;
  const userData = getUserData(userId);
  return userData.subscriptions.some(sub => sub.creatorId === creatorId);
}

/**
 * Add a subscription
 * @param {string} userId - Current user ID
 * @param {string} creatorId - Creator ID to subscribe to
 * @param {number} price - Subscription price
 */
export function addSubscription(userId, creatorId, price) {
  if (!userId || !creatorId) return;
  
  const userData = getUserData(userId);
  const existingIndex = userData.subscriptions.findIndex(sub => sub.creatorId === creatorId);
  
  const subscription = {
    creatorId,
    price,
    subscribedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    userData.subscriptions[existingIndex] = subscription;
  } else {
    userData.subscriptions.push(subscription);
  }
  
  saveUserData(userId, userData);
}

/**
 * Remove a subscription
 * @param {string} userId - Current user ID
 * @param {string} creatorId - Creator ID to unsubscribe from
 */
export function removeSubscription(userId, creatorId) {
  if (!userId || !creatorId) return;
  
  const userData = getUserData(userId);
  userData.subscriptions = userData.subscriptions.filter(sub => sub.creatorId !== creatorId);
  saveUserData(userId, userData);
}

/**
 * Get all user follows
 * @param {string} userId - Current user ID
 * @returns {Array} Array of creator IDs
 */
export function getFollows(userId) {
  if (!userId) return [];
  const userData = getUserData(userId);
  return userData.follows;
}

/**
 * Get all user purchases
 * @param {string} userId - Current user ID
 * @returns {Array} Array of content IDs
 */
export function getPurchases(userId) {
  if (!userId) return [];
  const userData = getUserData(userId);
  return userData.purchases;
}

/**
 * Get all user subscriptions
 * @param {string} userId - Current user ID
 * @returns {Array} Array of subscription objects
 */
export function getSubscriptions(userId) {
  if (!userId) return [];
  const userData = getUserData(userId);
  return userData.subscriptions;
}

/**
 * Clear all user data (for logout)
 * @param {string} userId - Current user ID
 */
export function clearUserData(userId) {
  if (!userId || typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`onlyfarms_user_${userId}`);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}

export default {
  isFollowing,
  toggleFollow,
  hasPurchased,
  addPurchase,
  isSubscribed,
  addSubscription,
  removeSubscription,
  getFollows,
  getPurchases,
  getSubscriptions,
  clearUserData
};
