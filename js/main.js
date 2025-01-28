document.addEventListener('DOMContentLoaded', init);
const dogBaseURL = 'https://dog.ceo/api/';
const nameBaseURL = 'https://randomuser.me/api/';

function init() {
  setUpWorker();
  addListeners();
  pageSpecific();
  getBreeds();
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
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.addEventListener('message', gotMessage);
    });
  }
  //form submit
  document.querySelector('form').addEventListener('submit', doSearch);
  //adopt buttons
  document.querySelector('main').addEventListener('click', doAdopt);
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

    let msg = {
      action: 'adopt',
      dog: { src, name, breed },
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
  let nameURL = nameBaseURL + '?results=3'; //url for dog names
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
      document.querySelector('main').innerHTML = '';
      for (let i = 0; i < images.message.length; i++) {
        let u = new URL(images.message[i]);
        let parts = u.pathname.split('/');
        //Eg: ['', 'breeds', 'greyhound-indian', 'rampur-greyhound.jpg']
        let brd = parts[2];

        let div = document.createElement('div');
        div.className = 'card';
        let p1 = document.createElement('p');
        div.append(p1);
        let img = document.createElement('img');
        img.src = images.message[i];
        img.alt = `${names.results[i]?.name.first} (${brd})`;
        img.setAttribute('data-breed', brd);
        p1.append(img);
        let p2 = document.createElement('p');
        div.append(p2);
        p2.textContent = `${names.results[i]?.name.first} (${brd})`;
        let p3 = document.createElement('p');
        div.append(p3);
        let btn = document.createElement('button');
        btn.className = 'btnAdopt';
        btn.innerHTML = '<span class="material-symbols-outlined">heart_plus</span> Adopt Now!';
        p3.append(btn);
        document.querySelector('main').append(div);
      }
    })
    .catch((err) => {
      console.warn(err.message);
      //TODO: display the error for the user
    });
}

function gotMessage(ev) {
  //got a message from the service worker
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
      break;
    case 'adopt':
      break;
    default:
  }
}

function getData() {
  //fetch calls
}

function buildCard() {
  //build a single card with a Dog pic and name
}
