importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// TODO: You must paste your actual Firebase Config values here!
// Service workers cannot easily read Vite's .env file variables, so we hardcode the config here.
const firebaseConfig = {
  apiKey: "AIzaSyC_Bn99WzEOUZ3kPZtgJH_iuJ-GJnKyJZw",
  authDomain: "flypsydemontu.firebaseapp.com",
  databaseURL: "https://flypsydemontu-default-rtdb.firebaseio.com",
  projectId: "flypsydemontu",
  storageBucket: "flypsydemontu.firebasestorage.app",
  messagingSenderId: "58478640837",
  appId: "1:58478640837:web:eb03632da1de11690b7aac"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Squad Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New activity in the squad.',
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
