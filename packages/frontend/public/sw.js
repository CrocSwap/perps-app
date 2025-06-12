const CACHE_NAME = 'my-app-cache-v0.0.11';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png',
    // Add more static assets if needed
];

// Install event: cache essential assets
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS_TO_CACHE);
        }),
    );
    self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys
                    .filter(function (key) {
                        return key !== CACHE_NAME;
                    })
                    .map(function (key) {
                        return caches.delete(key);
                    }),
            );
        }),
    );
    self.clients.claim();
});

// Fetch event: network-first for navigation, cache-first for assets
self.addEventListener('fetch', function (event) {
    var request = event.request;

    // Network-first for navigation (SPA routing)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(function (response) {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(function () {
                    return caches.match('/index.html');
                }),
        );
        return;
    }

    // Cache-first for other requests
    event.respondWith(
        caches.match(request).then(function (response) {
            return response || fetch(request);
        }),
    );
});

// Listen for skipWaiting message (for update prompts)
self.addEventListener('message', function (event) {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
