/* firebase-messaging-sw.js */
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyBFRqe3lhvzG0FoN0uAJlAP-VEz9bKLjUc",
    projectId: "mre23-4644a",
    messagingSenderId: "179268769077",
    appId: "1:179268769077:web:d9fb8cd25ad284ae0de87c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/logo/logo.png',
        badge: '/images/logo/logo.png',
        data: { url: '/index.html' }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
