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
  // get all reviews
  DBHelper.fetchReviewsById(restaurant.id, (error, reviews) => {
    // fill reviews
    fillReviewsHTML(reviews);
  })
  
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
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.querySelector('#reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    const form = createReviewForm();
    container.appendChild(form);
    return;
  }
  const ul = document.querySelector('#reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  container.appendChild(ul);
  const form = createReviewForm();
  container.appendChild(form);

  addReviews();
}



/**
*create a review form for all restaurants
*/
createReviewForm = () => {
  const form = document.createElement('form');
  form.setAttribute('class', 'reviews-form');
  const h2 = document.createElement('h2'); 
  h2.innerHTML = "Write Reviews";
  form.appendChild(h2);

  const nameInput = createNameInput();
  const ratingInput = createRatingInput();
  const commentInput = createCommentInput();

  const button = document.createElement('button');
  button.innerHTML = "submit";
  button.setAttribute('type', 'submit');

  form.appendChild(nameInput);
  form.appendChild(ratingInput);
  form.appendChild(commentInput);
  form.appendChild(button);

  return form;
}



/**
* create name input
*/
createNameInput = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('class', 'name');
  input.setAttribute('placeholder', 'Your name here...');
  


  return input;
}



/**
* create rating input
*/
createRatingInput = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'number');
  input.setAttribute('min', '1');
  input.setAttribute('max', '5');
  input.setAttribute('class', 'rating');
  input.setAttribute('placeholder', 'Your rating...');

  return input;
}



/**
* create comment box
*/
createCommentInput = () => {
  const textarea = document.createElement('textarea');
  textarea.setAttribute('class', 'comment');
  textarea.setAttribute('placeholder', 'Your comment...');

  
  return textarea;
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



/**
 * update reviews list
 */
updateReviewsHTML = review => {
  const ul = document.querySelector("#reviews-list");

  ul.appendChild(createReviewHTML(review));
}




/**
 * show snackbar
 */
snackbar = message => {
  // Get the snackbar DIV
  const x = document.querySelector(".snackbar");
  x.innerHTML = message;
  // Add the "show" class
  x.classList.add("show");
  // After 3 seconds, remove the show class from DIV
  setTimeout(() => x.classList.remove("show"), 3000);
};




/**
 * set form handler
 */
addReviews = () => {
  const form = document.querySelector('form');
  let name = form.querySelector('.name');
  let rating = form.querySelector('.rating');
  let comment = form.querySelector('.comment');
  console.log(form);
  console.log(name.value);
  
  form.addEventListener('submit', e => {
    e.preventDefault();

    if (name.value === "" || rating.value === "" || comment.value === "") {
      snackbar("all fields are required");
      return;
    }
    
  
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      if(navigator.onLine) {
        // online?
        const review = {
          name: name.value,
          rating: rating.value,
          comments: comment.value,
          restaurant_id: self.restaurant.id
        };
        console.log(name.value);
        
        DBHelper.sendReviewData(review, (error, data) => {
          if(error) {
            console.log(error);
          }
          updateReviewsHTML(data);
          snackbar("Sucessfully added your review");
        
          const unique = '_' + Math.random().toString(36).substr(2, 9);
          // add id to response
          data.unique = unique;
          db.addSingleReview(data);
          name.value = ""; 
          rating.value = ""; 
          comment.value = "";
        })
      } else {// offline?
        navigator.serviceWorker.ready
          .then(sw => {
            const date = new Date().toISOString();
            const review = {
              id: date,
              name: name.value,
              rating: rating.value,
              comments: comment.value,
              restaurant_id: self.restaurant.id
            }; 

            db.addOfflineReviewtoIDB(review)
              .then(() => {
                sw.sync.register("sync-new-reviews");
              })
              .then(() => {
                snackbar("Review saved for background syncing");
                review.createdAt = date;
                updateReviewsHTML(review);
                name.value = "";
                rating.value = "";
                comment.value = "";
              })
              .catch(err => console.log(err));

            // save  to IDB reviews
            const unique = '_' + Math.random().toString(36).substr(2, 9);
            // add id to rewiew
            review.unique = unique;
            db.addSingleReview(review);

          })
          .catch(error => console.log(error))
      }
      
    } else { // online and not syncing
      if (navigator.onLine) { 
        const review = {
          name: name.value,
          rating: rating.value,
          comments: comment.value,
          restaurant_id: self.restaurant.id
        };

        DBHelper.sendReviewData(review, (error, data) => {
          if (error) {
            console.log(error);
          }

          updateReviewsHTML(data);

          snackbar("Sucessfully added your review");

          const unique = '_' + Math.random().toString(36).substr(2, 9);
          // add id to response
          data.unique = unique;
          db.addSingleReview(data);
          name.value = "";
          rating.value = "";
          comment.value = "";
        })
      } else {
        // offine and not syncing
        snackbar("Sorry you cannot add review offline");
      }
      
    }

  })
}



/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.querySelector('.breadcrumb');
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
