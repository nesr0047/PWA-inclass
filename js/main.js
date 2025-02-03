document.addEventListener('DOMContentLoaded', init);
const dogBaseURL = 'https://dog.ceo/api/';
const nameBaseURL = 'https://randomuser.me/api/';

function init() {
  setUpWorker();
  addListeners();
  pageSpecific();
}

function getBreeds() {
  let url = dogBaseURL + 'breeds/list/all';
  fetch(url)
    .then((resp) => {
      if (!resp.ok) throw new Error('No breeds available');
      return resp.json(); // .text()  .blob()
    })
    .then((data) => {
      let select = document.getElementById('breeds');
      Object.keys(data.message).forEach((br) => {
        let opt = document.createElement('option');
        opt.textContent = br;
        opt.value = br;
        select.append(opt);
      });
    })
    .catch((err) => {
      console.warn(err.message);
      //TODO: display error for user
    });
}

function setUpWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
}

function addListeners() {
  //for all pages
  //service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', gotMessage);
  }
}

function doAdopt(ev) {
  let target = ev.target;
  if (target.localName === 'button' && target.className === 'btnAdopt') {
    //only if user clicked a button with the className btnAdopt
    let card = target.closest('.card');
    let img = card.querySelector('img');
    let src = img.src;
    let name = img.alt;
    let breed = img.getAttribute('data-breed');
    let uuid = target.getAttribute('data-ref'); //our generated id

    let msg = {
      action: 'adopt',
      dog: { uuid, src, name, breed },
    };
    sendMessage(msg);
  }
}

function doSearch(ev) {
  ev.preventDefault(); //stop the page reloading
  let breed = document.getElementById('breeds').value;
  let url = dogBaseURL;
  if (breed == '') {
    //any breed
    url += 'breeds/image/random/3';
  } else {
    //specific breed
    url += `breed/${breed}/images/random/3`;
  }
  let nameURL = nameBaseURL + '?results=3&nat=gb,au,ca'; //url for dog names
  Promise.all([fetch(url), fetch(nameURL)])
    .then((respArr) => {
      if (!respArr[0].ok) throw new Error('No dogs to be found');
      if (!respArr[1].ok) throw new Error('No names to be found');

      return Promise.all([respArr[0].json(), respArr[1].json()]);
    })
    .then((dataArr) => {
      //build the html
      let images = dataArr[0];
      let names = dataArr[1];
      console.log(images);
      console.log(names);
      let dogs = [];
      for (let i = 0; i < images.message.length; i++) {
        let u = new URL(images.message[i]);
        let parts = u.pathname.split('/');
        //Eg: ['', 'breeds', 'greyhound-indian', 'rampur-greyhound.jpg']
        let brd = parts[2];

        let dog = {
          uuid: crypto.randomUUID(),
          name: names.results[i]?.name?.first,
          breed: brd,
          src: u.href,
        };
        dogs.push(dog);
      }
      buildCards(dogs, true);
    })
    .catch((err) => {
      console.warn(err.message);
      //TODO: display the error for the user
    });
}

function gotMessage(ev) {
  //got a message from the service worker
  if ('action' in ev.data) {
    if (ev.data.action == 'adoptedSuccess') {
      //dog was saved in cache
      console.log(ev.data.dog);
      let uuid = ev.data.dog.uuid;
      let btn = document.querySelector(`button[data-ref="${uuid}"]`);
      btn.classList.add('adopted');
      btn.addEventListener('click', (ev) => {
        ev.stopImmediatePropagation(); //don't let the click go to the main element
        ev.target.setAttribute('disabled', 'disabled');
      });
    }
    if (ev.data.action === 'getAdoptedDogs') {
      let dogs = ev.data.dogs;
      console.log('list of dogs');
      console.log(dogs);
      buildCards(dogs);
      displayNumDogs(dogs.length); //NEW
    }
  }
}

function displayNumDogs(numDogs) {
  //NEW - tell the user about how many dogs they have adopted
}

function sendMessage(msg) {
  //send a message to the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage(msg);
    });
  }
}

function pageSpecific() {
  const id = document.body.id;
  switch (id) {
    case 'home':
      getBreeds();
      //form submit
      document.querySelector('form').addEventListener('submit', doSearch);
      //adopt buttons
      document.querySelector('main').addEventListener('click', doAdopt);
      break;
    case 'adopt':
      //get the list of adopted dogs
      //send a message to the SW saying please give me all the adopted dog data as an array

      getAdoptedDogs();
      break;
    default:
  }
}

function getAdoptedDogs() {
  let msg = {
    action: 'getAdoptedDogs',
  };
  sendMessage(msg);
}

function getData() {
  //fetch calls
}

function buildCards(dogs, withButtons = false) {
  //build cards with a Dog pic and name
  document.querySelector('main').innerHTML = '';
  for (let i = 0; i < dogs.length; i++) {
    let src = dogs[i].src;
    let breed = dogs[i].breed;
    let name = dogs[i].name;
    let uuid = dogs[i].uuid;

    let div = document.createElement('div');
    div.className = 'card';
    let p1 = document.createElement('p');
    div.append(p1);
    let img = document.createElement('img');
    img.src = src;
    img.alt = `${name} (${breed})`;
    img.setAttribute('data-breed', breed);
    p1.append(img);
    let p2 = document.createElement('p');
    div.append(p2);
    p2.textContent = `${name} (${breed})`;
    let p3 = document.createElement('p');
    div.append(p3);
    if (withButtons) {
      let btn = document.createElement('button');
      btn.className = 'btnAdopt';
      btn.setAttribute('data-ref', uuid);
      btn.innerHTML = '<span class="material-symbols-outlined">heart_plus</span> Adopt Now!';
      p3.append(btn);
    }
    document.querySelector('main').append(div);
  }
}
