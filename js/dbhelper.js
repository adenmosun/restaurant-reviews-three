


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








const db = (() => {
  const dbPromise = idb.open('restaurants-reviews', 2, upgradeDb => {
    if (!upgradeDb.objectStoreNames.contains("restaurants")) {
      upgradeDb.createObjectStore("restaurants", { 
        keyPath: "id" 
      });
    }

    if (!upgradeDb.objectStoreNames.contains("reviews")) {
      const reviewsDb = upgradeDb.createObjectStore("reviews", {
        keyPath: "unique"
      });
      reviewsDb.createIndex("restaurant_id", "restaurant_id");
    }

    if (!upgradeDb.objectStoreNames.contains("offline-reviews")) {
      upgradeDb.createObjectStore("offline-reviews", {
        keyPath: "id"
      });
    }

  });



  fetchbyid = id => {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants');
      const restaurantStore = tx.objectStore('restaurants');

      return restaurantStore.get(parseInt(id));
    })
    .then(restaurant => restaurant)
    .catch(error => console.log('Unable to fetch restaurant', error))
  };




  storebyId = restaurant => {
    dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');

      store.put(restaurant);
      return tx.complete;
    })
    .then(() => console.log('Restaurant added'))
    .catch(error => console.log('Unable to store restaurant', error));
  };



  addReviewByRestaurantId = reviews => {
    dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");

      for(review of reviews) {
        store.put(review);
      }
      return tx.complete;
    })
    .then(() => console.log('Reviews saved to IDB'))
    .catch(error => console.log('Unable to save reviews to IDB',error));
  }


 

  addSingleReview = review => {
    dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");

      store.put(review);
      return tx.complete;
    })
      .then(() => console.log('Review saved to IDB'))
      .catch(error => console.log('Unable to save review to IDB', error));
  }


  getReviewByRestaurantId = restaurantId => {
    return dbPromise.then(db => {
      const tx = db.transaction("reviews");
      let store = tx.objectStore("reviews");
      store = store.index("restaurant_id")

      return store.getAll(parseInt(restaurantId));
    })
      .then(reviews => reviews)
      .catch(error => console.log('Unable to fetch reviews from idb', error));
  }


 
  addOfflineReviewtoIDB = (data) => {
    return dbPromise
      .then(db => {
        const tx = db.transaction("offline-reviews", 'readwrite');
        const store = tx.objectStore("offline-reviews");
        store.put(data);
        return tx.complete;
      });
  }


 
  getOfflineReviewa = () => {
    return dbPromise
      .then(db => {
        const tx = db.transaction("offline-reviews", "readonly");
        const store = tx.objectStore("offline-reviews");

        return store.getAll();
      });
  }



  deleteofflineReview = id => {
    return dbPromise
      .then(db => {
        const tx = db.transaction("offline-reviews", "readwrite");
        const store = tx.objectStore("offline-reviews");
        store.delete(id);
        return tx.complete;
      })
      .then(() => console.log('offline review deleted'));
  }



  return {
    storebyId: (storebyId),
    fetchbyid: (fetchbyid),
    addReviewByRestaurantId: (addReviewByRestaurantId),
    addSingleReview: (addSingleReview),
    getReviewByRestaurantId: (getReviewByRestaurantId),
    addOfflineReviewtoIDB: (addOfflineReviewtoIDB),
    getOfflineReviewa: (getOfflineReviewa),
    deleteofflineReview: (deleteofflineReview)
  }
})();










/**
 * Common database helper functions.
 */
class DBHelper {


  static get DATABASE_URL() {
    const port = 1337; 
    return `http://localhost:${port}/restaurants`;
  }





  // Fetch all restaurants.
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(res => res.json())
      .then(data => callback(null, data))
      .catch(err => {
        const error = `Request failed. Returned status of ${err}`;
        callback(error, null);
      });
  }




  // Fetch a restaurant by its ID.
  static fetchRestaurantById(id, callback) {
    db.fetchbyid(id)
      .then(restaurant => {
        if (restaurant) {
          console.log("Get restaurant from indexedDB");
          callback(null, restaurant);
        } else {
          fetch(`${DBHelper.DATABASE_URL}/${id}`)
            .then(res => res.json())
            .then(restaurant => {
              callback(null, restaurant);
              db.storebyId(restaurant);
            })
            .catch(error => console.log(error));
        }
      })
      .catch(error => console.log(error));
  }




  // Fetch restaurants by a cuisine type with proper error handling.
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



  // Fetch restaurants by a neighborhood with proper error handling.
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



  // Fetch restaurants by a cuisine and a neighborhood with proper error handling.
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }



  // Fetch all neighborhoods with proper error handling.
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }



  // Fetch all cuisines with proper error handling.
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
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
   * get restaurant reviews
   */
  static fetchReviewsById(id, callback) {
    db.getReviewByRestaurantId(id)
      .then(reviews => {
        if (reviews.length > 0) {
          console.log("Retrieved reviews from IDB");
          callback(null, reviews);
        } else {
          const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
          fetch(url)
            .then(res => res.json())
            .then(reviews => {
              reviews = reviews.map(review => {
                const unique =
                  "_" +
                  Math.random()
                    .toString(36)
                    .substr(2, 9);
                return {
                  id: review.id,
                  restaurant_id: review.restaurant_id,
                  unique: unique,
                  name: review.name,
                  rating: review.rating,
                  comments: review.comments,
                  createdAt: review.createdAt,
                  updatedAt: review.updatedAt
                };
              });
              db.addReviewByRestaurantId(reviews);
              callback(null, reviews);
            })
            .catch(error => callback(error, null));
        }
      })
      .catch(error => callback(error, null));
  }




  /**
   * save reviews to the database
   */
  static sendReviewData(review, callback) {
    const url = "http://localhost:1337/reviews/";

    fetch(url, {
      method: "POST",
      header: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(review)
    })
      .then(res => res.json())
      .then(review => callback(null, review))
      .catch(error => {
        callback(error, null);
      });
  }

  

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
}

