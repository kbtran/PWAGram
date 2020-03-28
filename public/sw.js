var CACHE_STATIC_NAME = 'static-v15';
var CACHE_DYNAMIC_NAME = 'dynamic-v3';
var STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

 //function trimCache(cacheName, maxItems) {
 //  caches.open(cacheName)
 //    .then(function (cache) {
 //      return cache.keys()
 //        .then(function (keys) {
 //          if (keys.length > maxItems) {
 //            cache.delete(keys[0])
 //              .then(trimCache(cacheName, maxItems));
 //          }
 //        });
 //    })
 //}

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function (cache) {
                console.log('[Service Worker] Precaching App Shell');
                cache.addAll(STATIC_FILES);
            })
    );

});

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activating Service Worker ...', event);
    event.waitUntil(
        caches.keys()
            .then(function (keylist) {
                return Promise.all(keylist.map(function (key) {
                    // if not current cache, remove them
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Service Worker] Removing old cache.', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

//function isInArray(string, array) {
//    for (var i = 0; i < array.length; i++) {
//        if (array[i] === string) {
//            return true;
//        }
//    }
//    return false;
//}

// Above will work fine for full URLs stored in STATIC_FILES  (e.g. the CDN links) but it'll fail for / , /index.html  etc.
// Am improvement
function isInArray(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        console.log('matched ', string);
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
}

// Cache then network with offline support
self.addEventListener('fetch', function (event) {
    var url = 'https://pwagram-6478c.firebaseio.com/posts.json';

    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(
            caches.open(CACHE_DYNAMIC_NAME)
                .then(function (cache) {
                    return fetch(event.request)
                        .then(function (res) {
                            // trimCache(CACHE_DYNAMIC_NAME, 3);
                            cache.put(event.request, res.clone());
                            return res;
                        });
                })
        );
    } else if (isInArray(event.request.url, STATIC_FILES)) {
        event.respondWith(
            caches.match(event.request)
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(function (res) {
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function (cache) {
                                       // trimCache(CACHE_DYNAMIC_NAME, 3);
                                        cache.put(event.request.url, res.clone());
                                        return res;
                                    })
                                    .catch(function (err) {
                                        return caches.open(CACHE_STATIC_NAME)
                                            .then(function (cache) {
                                                if (event.request.headers.get('accept').includes('text/html')) {
                                                    return cache.match('/offline.html');
                                                }       
                                            });
                                    });
                            });
                    }
                })
        );      
    }
});

// Cache then network with dynamic caching strategy 
//self.addEventListener('fetch', function (event) {
//     console.log('[Service Worker] Fetching something ....', event);
//    event.respondWith(
//        caches.match(event.request)
//            .then(function (response) {
//                if (response) {
//                    return response;
//                } else {
//                    return fetch(event.request)
//                        .then(function (res) {
//                            return caches.open(CACHE_DYNAMIC_NAME)
//                                .then(function (cache) {
//                                    cache.put(event.request.url, res.clone());
//                                    return res;
//                                })
//                                .catch(function (err) {
//                                    return caches.open(CACHE_STATIC_NAME)
//                                        .then(function (cache) {
//                                            return cache.match('/offline.html');
//                                        });
//                                });
//                        });
//                }
//            })
//    );
//});

// Network with cache fallback
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        fetch(event.request)
//            .then(function (res) {
//                return caches.open(CACHE_DYNAMIC_NAME)
//                    .then(function (cache) {
//                        cache.put(event.request.url, res.clone());
//                        return res;
//                    });
//            })
//            .catch(function (err) {
//                return caches.match(event.request);
//            })
//    );
//});

// Cache only
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        caches.match(event.request)
//    );        
//});

// Network only with Service worker
//self.addEventListener('fetch', function (event) {
//    event.respondWith(
//        fetch(event.request)
//    );
//});

 