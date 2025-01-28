const version = 1;
const appCache = 'appFiles_' + version;
const imgCache = 'dogImages_' + version;
const adoptCache = 'adoptedDogs_' + version;

const appFiles = ['/', '/index.html', '/adopt.html', '/css/main.css', '/js/main.js'];

self.addEventListener('install', (ev) => {}); //Homework
self.addEventListener('activate', (ev) => {}); //Homework
self.addEventListener('fetch', (ev) => {});
self.addEventListener('message', (ev) => {
  if ('action' in ev.data && ev.data.action == 'adopt') {
    adoptADog(ev.data.dog);
  }
});

function adoptADog(dog) {
  let str = JSON.stringify(dog);
  let filename = crypto.randomUUID() + '.json';
  let file = new File([str], filename, { type: 'application/json' });
  let resp = new Response(file, { status: 200, headers: { 'content-type': 'application/json' } });
  let request = new Request(`/${filename}`);

  caches
    .open(adoptCache)
    .then((cache) => {
      cache.put(request, resp);
    })
    .then(() => {
      console.log('saved the adoption');
      sendMessage({ message: 'Dog successfully adopted', filename: filename });
    });
}

function sendMessage(msg, client) {
  //client is falsey means send to all

  clients.matchAll().then((clientList) => {
    for (let client of clientList) {
      client.postMessage(msg);
    }
  });
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
