const version = 1;
const appCache = 'appFiles_' + version;
const imgCache = 'dogImages_' + version;
const adoptCache = 'adoptedDogs_' + version;

const appFiles = ['/', '/index.html', '/adopt.html', '/css/main.css', '/js/main.js'];

self.addEventListener('install', (ev) => {});
self.addEventListener('activate', (ev) => {});
self.addEventListener('fetch', (ev) => {});
self.addEventListener('message', (ev) => {});

function sendMessage(msg, client) {
  //client is falsey means send to all
}

function cacheOnly(ev) {
  //only the response from the cache
  return caches.match(ev.request);
}

function cacheFirst(ev) {
  //try cache then fetch
  return caches.match(ev.request).then((cacheResponse) => {
    return cacheResponse || fetch(ev.request);
  });
}

function networkOnly(ev) {
  //only the result of a fetch
  return fetch(ev.request);
}

function networkFirst(ev) {
  //try fetch then cache
  return fetch(ev.request).then((response) => {
    if (response.status > 0 && !response.ok) return caches.match(ev.request);
    return response;
  });
}

function staleWhileRevalidate(ev) {
  //return cache then fetch and save latest fetch
  return caches.match(ev.request).then((cacheResponse) => {
    let fetchResponse = fetch(ev.request).then((response) => {
      return caches.open(cacheName).then((cache) => {
        cache.put(ev.request, response.clone());
        return response;
      });
    });
    return cacheResponse || fetchResponse;
  });
}

function networkFirstAndRevalidate(ev) {
  //attempt fetch and cache result too
  return fetch(ev.request).then((response) => {
    if (response.status > 0 && !response.ok) return caches.match(ev.request);
    //accept opaque responses with status code 0
    //still save a copy
    return caches.open(cacheName).then((cache) => {
      cache.put(ev.request, response.clone());
      return response; //send the fetch response to the web page/script
    });
  });
}
