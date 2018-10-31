
const cache_name = 'restaurant-reviews-v1';
const cache_items = [
        "./",
        "./index.html",  
        "./restaurant.html",
        "./css/styles.css",
        "./js/dbhelper.js",
        "./js/main.js",
        "./js/restaurant_info.js",
        "./img/",
        "./manifest.json"
      ]


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cache_name)
      .then((cache) => cache.addAll(cache_items))
  )
});


self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(key => {
          if (key !== cache_name) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
});


addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;     
          
        } else {
          return fetch(event.request)   
          
            .then(res => caches.open(cache_name)
            .then(cache => {
              cache.put(event.request.url, res.clone());   
            
              return res;  
            }))
            .catch(err => caches.open("Error")
            .then(cache => cache.match(cache_name)));
        }
      })
  );
});         



self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});