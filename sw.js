var CACHE_NAME = '2048-solana-v1';
var urlsToCache = [
  '.',
  'index.html',
  'style/main.css',
  'js/bind_polyfill.js',
  'js/classlist_polyfill.js',
  'js/animframe_polyfill.js',
  'js/keyboard_input_manager.js',
  'js/html_actuator.js',
  'js/grid.js',
  'js/tile.js',
  'js/local_storage_manager.js',
  'js/game_manager.js',
  'js/solana_manager.js',
  'js/application.js',
  'https://unpkg.com/@solana/web3.js@1.91.0/lib/index.iife.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});
