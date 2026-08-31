/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { User } from '../types';

export const USER_SYNC_CHANNEL_NAME = 'phc_user_auth_sync';
export const USER_SYNC_STORAGE_KEY = 'cms_user_sync_ping';

export interface UserSyncEventPayload {
  action: 'PERMISSIONS_UPDATED' | 'USER_UPDATED' | 'USER_CREATED' | 'USER_DELETED' | 'SESSION_REFRESH';
  userId?: string;
  user?: Partial<User>;
  timestamp: number;
  sourceTabId?: string;
}

// Unique identifier for the current browser tab session to avoid self-processing loops
const CURRENT_TAB_ID = typeof window !== 'undefined' 
  ? (window.name || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
  : 'server_tab';

if (typeof window !== 'undefined' && !window.name) {
  window.name = CURRENT_TAB_ID;
}

/**
 * Safely dispatches a custom event across all browsers without constructor errors
 */
export function dispatchSafeCustomEvent(eventName: string, detail?: any) {
  try {
    if (typeof window === 'undefined') return;
    if (typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } else if (typeof document !== 'undefined' && typeof document.createEvent === 'function') {
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(eventName, false, false, detail);
      window.dispatchEvent(evt);
    }
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Broadcasts a user/permission update across all tabs, windows, and triggers cross-session sync.
 */
export function broadcastUserSync(action: UserSyncEventPayload['action'], user?: Partial<User>, userId?: string) {
  const payload: UserSyncEventPayload = {
    action,
    userId: userId || user?.UserID,
    user,
    timestamp: Date.now(),
    sourceTabId: CURRENT_TAB_ID
  };

  // 1. BroadcastChannel API for instantaneous tab-to-tab sync
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window && typeof BroadcastChannel === 'function') {
      const channel = new BroadcastChannel(USER_SYNC_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch (e) {
    // Ignore if not supported
  }

  // 2. LocalStorage storage event fallback (fires in other tabs of same browser)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(USER_SYNC_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (e) {}

  // 3. Dispatch in-memory custom DOM events for same-window listeners
  dispatchSafeCustomEvent('phc_local_user_updated', payload);
  dispatchSafeCustomEvent('phc_db_updated');
}

/**
 * Subscribes to user sync events across BroadcastChannel and Storage events from OTHER tabs.
 * Returns an unsubscription function for React useEffect cleanup.
 */
export function subscribeToUserSync(onSync: (payload?: UserSyncEventPayload) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let channel: BroadcastChannel | null = null;

  // BroadcastChannel listener
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(USER_SYNC_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent) => {
        if (event.data && event.data.sourceTabId !== CURRENT_TAB_ID) {
          onSync(event.data);
        }
      };
    }
  } catch (e) {}

  // Storage event listener for other tabs in same browser
  const handleStorage = (event: StorageEvent) => {
    if (event.key === USER_SYNC_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed && parsed.sourceTabId !== CURRENT_TAB_ID) {
          onSync(parsed);
        }
      } catch (e) {
        onSync();
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch (e) {}
    }
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * Compares two User objects to check if any critical security/permission/identity properties changed.
 */
export function haveUserPermissionsChanged(u1: User | null | undefined, u2: User | null | undefined): boolean {
  if (!u1 || !u2) return false;
  if (u1.UserID !== u2.UserID) return true;
  if (u1.Role !== u2.Role) return true;
  if (u1.FullName !== u2.FullName) return true;
  if (u1.AssignedShift !== u2.AssignedShift) return true;
  if (u1.PasswordHash !== u2.PasswordHash) return true;
  if (u1.Status !== u2.Status) return true;
  if (u1.AccessApprovalStatus !== u2.AccessApprovalStatus) return true;

  // Compare AllowedUserIDs
  const a1 = JSON.stringify(u1.AllowedUserIDs || []);
  const a2 = JSON.stringify(u2.AllowedUserIDs || []);
  if (a1 !== a2) return true;

  // Compare Permissions object
  const p1 = JSON.stringify(u1.Permissions || {});
  const p2 = JSON.stringify(u2.Permissions || {});
  if (p1 !== p2) return true;

  // Compare UserRights array
  const r1 = JSON.stringify(u1.UserRights || []);
  const r2 = JSON.stringify(u2.UserRights || []);
  if (r1 !== r2) return true;

  return false;
}

