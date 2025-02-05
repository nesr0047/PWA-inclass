const version = 7;
const appCache = 'appFiles_' + version;
const imgCache = 'dogImages_' + version;
const adoptCache = 'adoptedDogs_' + version;

const appFiles = [
  './',
  './index.html',
  './adopt.html',
  './css/main.css',
  './js/main.js',
  './img/favicon.ico',
  './img/favicon.svg',
  './manifest.json',
  './img/apple-touch-icon.png',
  './img/favicon-96x96.png',
  './img/web-app-manifest-192x192.png',
  './img/web-app-manifest-512x512.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(appCache).then((cache) => {
      cache.addAll(appFiles);
    })
  );
}); //Homework
self.addEventListener('activate', (ev) => {
  caches.keys().then((cacheList) => {
    //filter out the ones that DO match the current cache names
    return Promise.all(cacheList.filter((cache) => ![appCache, imgCache, adoptCache].includes(cache)).map((cache) => caches.delete(cache)));
  });
}); //Homework

self.addEventListener('message', (ev) => {
  if ('action' in ev.data) {
    if (ev.data.action == 'adopt') {
      adoptADog(ev.data.dog);
    }
    if (ev.data.action == 'getAdoptedDogs') {
      console.log('get the list of adopted dogs');
      getListOfDogs(ev);
    }
    if (ev.data.action === 'goGetLunch') {
    }
    if (ev.data.action === 'sellTheDogs') {
    }
  }
});

function getListOfDogs(ev) {
  //SW will caches.open()
  // cache.keys()
  // cache.match(key) for each file (key) => response
  // response.json() on each response
  // send the resulting array of objects as a message to main.js
  ev.waitUntil(
    caches.open(adoptCache).then(async (cache) => {
      let requests = await cache.keys(); //get the list of json files in the cache
      let responses = await Promise.all(requests.map((req) => cache.match(req))); //cache.match for each filename
      let dogs = await Promise.all(responses.map((resp) => resp.json())); // resp.json() for each response

      // [
      //   {uuid:'', breed:'', src:'', name:''},
      //   {uuid:'', breed:'', src:'', name:''},
      //   {uuid:'', breed:'', src:'', name:''},
      //   {uuid:'', breed:'', src:'', name:''},
      // ]

      let clientid = ev.source.id;
      let msg = {
        action: 'getAdoptedDogs',
        dogs,
      };
      sendMessage(msg, clientid);
    })
  );
}

function adoptADog(dog) {
  let str = JSON.stringify(dog);
  let filename = dog.uuid + '.json';
  let file = new File([str], filename, { type: 'application/json' });
  let resp = new Response(file, { status: 200, headers: { 'content-type': 'application/json' } });
  let request = new Request(`/${filename}`);

  caches
    .open(adoptCache)
    .then((cache) => {
      return cache.put(request, resp);
      //  return;
    })
    .then(() => {
      console.log('saved the adoption');
      sendMessage({ action: 'adoptedSuccess', message: 'Dog successfully adopted', dog });
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

function staleWhileRevalidate(ev, cacheName) {
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
let isOnline = true;
self.addEventListener('online', (ev) => {
  isOnline = true;
});
self.addEventListener('offline', (ev) => {
  isOnline = false;
});
self.addEventListener('fetch', (ev) => {
  let mode = ev.request.mode; // navigate, cors, no-cors
  let method = ev.request.method; //get the HTTP method
  let url = new URL(ev.request.url); //turn the url string into a URL object
  let params = url.searchParams; // params.has('id')  params.get('id') params.set('id')
  // let queryString = new URLSearchParams(url.search); //turn query string into an Object
  let online = navigator.onLine && isOnline; //determine if the browser is currently offline
  let isImage =
    url.pathname.includes('.png') ||
    url.pathname.includes('.ico') ||
    url.pathname.includes('.jpg') ||
    url.pathname.includes('.svg') ||
    url.pathname.includes('.gif') ||
    url.pathname.includes('.webp') ||
    url.pathname.includes('.jpeg') ||
    url.hostname.includes('picsum.photos'); //check file extension or location

  let isAPI = url.hostname.includes('dog.ceo') || url.hostname.includes('randomuser.me');
  let isAPIImage = url.hostname.includes('images.dog.ceo');

  let selfLocation = new URL(self.location);
  //determine if the requested file is from the same origin as your website
  let isRemote = selfLocation.origin !== url.origin;
  // http://127.0.0.1:5500 == origin

  // console.log({ online });
  if (online) {
    //online
    if (isImage && isAPIImage) {
      ev.respondWith(fetchAndCache(ev, imgCache));
    } else if (isAPI) {
      //isAPIImage or not
      ev.respondWith(fetchAndCache(ev, appCache));
    } else {
      ev.respondWith(staleWhileRevalidate(ev, appCache));
    }
  } else {
    //offline
    if (url.protocol.startsWith('ws')) {
      ev.respondWith(new Response(null, { status: 404 }));
    }
    ev.respondWith(cacheOnly(ev));
  }
});
function fetchAndCache(ev, cacheName) {
  return fetch(ev.request).then(async (fetchResponse) => {
    await caches.open(cacheName).then((cache) => {
      cache.put(ev.request, fetchResponse.clone());
    });
    return fetchResponse;
  });
}
