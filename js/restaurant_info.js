
let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoidGF5b2FkZW5tb3N1biIsImEiOiJjamtodjl5cWMwdnd3M2twYm1ueGIzM2phIn0.q2DVLZ9FVbsosAeeFNaftg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  images = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = images.small;
  image.alt = `${restaurant.name} - image representation of restaurant`;
  image.srcset = `${images.small} 320w, ${images.medium} 510w, ${images.large} 800w`;
  image.sizes = `(min-width: 800px) 30vw, (min-width: 502px) and (max-width: 509px) 20vw, 10vw`;


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
   fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }
  let dbPromise = idb.open('reviews-db', 1, (upgradeDb) =>{
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    };
    if(!upgradeDb.objectStoreNames.contains('db-reviews')){
      let dbData = upgradeDb.createObjectStore('db-reviews',  {autoIncrement: true});
    }
  });

  let reviews;
  const reviews_URL = "http://localhost:1337/reviews";
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');

  title.innerHTML = 'Reviews';
  container.appendChild(title);

  fetch(reviews_URL).then((response) =>{
     return response.json();

  }).then((review) =>{
    reviews = review;
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {

    if(review.restaurant_id === self.restaurant.id){
      ul.appendChild(createReviewHTML(review));
      }
    });

    ul.appendChild(addReviews());
    container.appendChild(ul);
    dbPromise.then((db) => {
        let tx = db.transaction('db-reviews', 'readwrite');
        let store = tx.objectStore('db-reviews');
        let countResults = store.count().then(function(results) {

           if(results < 1){
             store.add(reviews);
             return tx.complete;
           } else {
             return Promise.resolve();
           }; 
        });
    });

   }).catch(() => {
    dbPromise.then((db) => {
      let tx = db.transaction('db-reviews', 'readonly');
      let store = tx.objectStore('db-reviews');
      return store.openCursor();

    }).then(function continueCursoring(cursor) {
        if (!cursor) {
          return;
        }
        if(cursor.value){
          reviews = cursor.value;
          const ul = document.getElementById('reviews-list');
          reviews.forEach(review => {

          if(review.restaurant_id === self.restaurant.id){;
            ul.appendChild(createReviewHTML(review));
           }
        });
          ul.appendChild(addReviews());
          container.appendChild(ul);
        } else {
          if (!reviews) {
              const emptyReviews = document.createElement('p');
              emptyReviews.innerHTML = 'No reviews yet!';
              container.appendChild(emptyReviews);
              return;
            }
        };
        return cursor.continue().then(continueCursoring);
      });
  })
}


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = `${new Date(review.createdAt)}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}



addReviews = (review) => {
    const form = document.createElement('form');
    const addReviewTitle = document.createElement('h2')
    addReviewTitle.setAttribute("class", "reviewTitle");
    addReviewTitle.innerHTML = "Write Reviews";
    form.appendChild(addReviewTitle);

    const reviewerName = document.createElement('input');
    reviewerName.setAttribute('class', 'reviewer-name');
    reviewerName.setAttribute('type', 'text');
    reviewerName.setAttribute('placeholder', 'Your name please...');
    form.appendChild(reviewerName);

    const reviewerRating = document.createElement('input');
    reviewerRating.setAttribute('class', 'reviewer-rating');
    reviewerRating.setAttribute('type', 'number');
    reviewerRating.setAttribute('placeholder', 'Your rating...');
    form.appendChild(reviewerRating);

    const reviewerComment = document.createElement('textarea');
    reviewerComment.setAttribute('class', 'reviewer-comment');
    reviewerComment.setAttribute('type', 'text');
    reviewerComment.setAttribute('placeholder', 'Your review...');
    form.appendChild(reviewerComment);


    newReviewButton = (entry) => {
    entry.preventDefault();
      let reviewObject = {
          "restaurant_id": self.restaurant.id,
          "name": reviewerName.value,
          "createdAt": (new Date()).getTime(),
          "updatedAt": (new Date()).getTime(),
          "rating": parseInt(reviewerRating.value),
          "comments": reviewerComment.value 
        }


        if((reviewObject.rating < 0 ) || (reviewObject.rating > 5) ||
          (reviewObject.name === "") || (reviewObject.rating === "") || 
          (reviewObject.comments === "")){
         window.alert(`No field must be left empty and your rating must be from 0 to 5`)
        } else {
         const url = 'http://localhost:1337/reviews';
           fetch(url, {
             method: 'POST',
             headers:{
               'Content-Type': 'application/json'
             }, 
             body: JSON.stringify(reviewObject)

           }).then(res => res.json())
           .then(response => console.log('Your restaurant reviews', JSON.stringify(response)))
           .catch(error => console.error('Error:', error));
        }
        
        successMessage.style.display = "block";

        form.reset();
  }


      const reviewButton = document.createElement('button');
      reviewButton.setAttribute('class', 'review-button');
      reviewButton.addEventListener("click", newReviewButton);
      reviewButton.innerHTML = "Submit Review";
      form.appendChild(reviewButton);

      const successMessage = document.createElement('h2')
      successMessage.setAttribute("class", "reviewTitle");
      successMessage.innerHTML = "Thank you for your review.";
      successMessage.style.display = 'none';
      form.appendChild(successMessage);

      
      return form;
  
}


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
