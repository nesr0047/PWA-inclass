document.addEventListener('DOMContentLoaded', init);
const dogBaseURL = 'https://dog.ceo/api/';
const nameBaseURL = 'https://randomuser.me/api/';

function init() {
  setUpWorker();
  addListeners();
  pageSpecific();
}

function setUpWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
}

function addListeners() {
  //for all pages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active.addEventListener('message', gotMessage);
    });
  }
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
