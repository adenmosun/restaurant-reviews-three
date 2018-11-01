if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(function (registration) {
          console.log('Service Worker registration successful with scope: ',
            registration.scope);
        })
        .catch(function (err) {
          console.log('Service Worker registration failed: ', err);
        });
    }

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  //Fetch all restaurants.
  static fetchRestaurants(callback) {
    if (!('indexedDB' in window)) {
      console.log('This browser does not support IndexedDB');
    return;
    }
    let dbPromise = idb.open('restaurant-db', 1, (upgradeDb) =>{
      // If browser doesn't support service worker, there's no need having a db
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      };
      if(!upgradeDb.objectStoreNames.contains('details-db')){
        let db_details = upgradeDb.createObjectStore('details-db',  {autoIncrement: true});
      }
    });


    let DATABASE_URL = "http://localhost:1337/restaurants";
    let restaurants;
    fetch(DATABASE_URL)
    .then((response) =>{ return response.json();

    }).then((restaurant) =>{
      restaurants = restaurant;
      dbPromise.then((db) => {
        let tx = db.transaction('details-db', 'readwrite');
        let store = tx.objectStore('details-db');
        let countRequest = store.count().then(function(results) {
         if(results < 1){
          store.add(restaurants);
          return tx.complete;
        } else {
          return Promise.resolve();
          }; 
        });
      });


      callback(null, restaurants);
      }).catch(() => {
        dbPromise.then((db) => {
          let tx = db.transaction('details-db', 'readonly');
          let store = tx.objectStore('details-db');
        return store.openCursor();

      }).then(function continueCursoring(cursor) {

        if (!cursor) {
          return;
        }

        if(cursor.value){
          restaurants = cursor.value;
          callback(null, restaurants);
        } else {
          const error = `Error in processing`;
          callback(error, null)
        };
        return cursor.continue().then(continueCursoring);
      });
    }); 
  }  


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const image_path = `./img/${restaurant.id}`;
    return {
      small: `${image_path}-small.jpg`,
      medium: `${image_path}-medium.jpg`,
      large: `${image_path}-large.jpg`
    };
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      { title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

