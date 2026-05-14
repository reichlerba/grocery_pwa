//  PWA apps cache files on first load, from the Service Worker, and later only serves cached version

const CACHE_NAME = "grocery-app-1.0";

const FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./style.css",
    "./app.js"
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES);
        })
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(res => {
            return res || fetch(e.request);
        })
    );
});
