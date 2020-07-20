'use strict';

const CACHE_NAME = 'static-cache-v5';
const DATA_CACHE_NAME = 'data-cache-v5';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/scripts/install.js',
];

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
	evt.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
		  console.log('[ServiceWorker] Pre-caching offline page');
		  return cache.addAll(FILES_TO_CACHE);
		})
	);

  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
	evt.waitUntil(
		caches.keys().then((keyList) => {
		  return Promise.all(keyList.map((key) => {
			if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
			  console.log('[ServiceWorker] Removing old cache', key);
			  return caches.delete(key);
			}
		  }));
		})
	);
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  console.log('[ServiceWorker] Fetch', evt.request.url);
	if (evt.request.url.includes('/forecast/')) {
		console.log('03');
	  console.log('[Service Worker] Fetch (data)', evt.request.url);
	  console.log('04');
	  evt.respondWith(
		  caches.open(DATA_CACHE_NAME).then((cache) => {
			return fetch(evt.request)
				.then((response) => {
				  // If the response was good, clone it and store it in the cache.
				  if (response.status === 200) {
					cache.put(evt.request.url, response.clone());
				  }
				  return response;
				}).catch((err) => {
				  // Network request failed, try to get it from the cache.
				  return cache.match(evt.request);
				});
		  }));
	  return;
	}
	evt.respondWith(
		caches.open(CACHE_NAME).then((cache) => {
		  return cache.match(evt.request)
			  .then((response) => {
				return response || fetch(evt.request);
			  });
		})
	);

});
