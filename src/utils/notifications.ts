/// <reference types="vite/client" />
import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';

export const requestNotificationPermission = async (userId: string) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted' && messaging) {
    try {
      // 1. Get the FCM Token from Google Push Servers.
      // We pass the VAPID key which acts as the Web Push Certificate
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (token) {
        console.log('FCM Token Generated:', token);
        // 2. Save the token to the database so our (future) backend knows where to push to!
        const tokenRef = ref(db, `users/${userId}/fcmToken`);
        await set(tokenRef, token);
        return true;
      } else {
        console.warn('No registration token available.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  }

  return false;
};
