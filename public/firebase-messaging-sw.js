// This file MUST be in the /public folder

// We are using the compat libraries here because service workers don't support ES modules.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker with the same config
const firebaseConfig = {
  apiKey: "AIzaSyB334gb71yjX0yMstR7CjBmB4GMdF9Bak0",
  authDomain: "studio-5667457400-e2c8f.firebaseapp.com",
  projectId: "studio-5667457400-e2c8f",
  storageBucket: "studio-5667457400-e2c8f.firebasestorage.app",
  messagingSenderId: "979371818437",
  appId: "1:979371818437:web:32496cc33253cd55ee9fac"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // You can add a logo in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
