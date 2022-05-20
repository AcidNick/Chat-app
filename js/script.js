const firebaseConfig = {
  apiKey: "AIzaSyAsNWR8mIqk8_zq8Oib3bZEP2cQQCEry2I",
  authDomain: "chapp-app-5c017.firebaseapp.com",
  projectId: "chapp-app-5c017",
  storageBucket: "chapp-app-5c017.appspot.com",
  messagingSenderId: "909093860506",
  appId: "1:909093860506:web:87fd6deb0dfa2fa7e51b23",
  measurementId: "G-PTLY7WF9YC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
/* Henter HTML-elementer */
let chatVinduEl = document.querySelector("#chatVindu");
let meldingEl = document.querySelector("#melding");
let sendEl = document.querySelector("#sendMelding");
let sendBildeEl = document.querySelector("#sendBilde");

/*   Legger til lytter på knappen */  
sendEl.addEventListener("click", sendMelding);
sendBildeEl.addEventListener("click", sendBilde);

/* Man logger inn med navnet sitt */
let mittnavn = "";
if (!localStorage.navn) {
  mittNavn = prompt("Logg inn!\nHva heter du?");
  while (!mittNavn || mittNavn.length < 3) {
    mittNavn = prompt("Logg inn!\nHva heter du?"); /* Hvis man ikke skriver noe kommer boksen opp på nytt */
  }
  /* Gjør at alle navn har stor forvbokstav og resten er små */
  mittNavn = mittNavn.substring(0,1).toUpperCase() + mittNavn.substring(1).toLowerCase();
  localStorage.navn = mittNavn;
} else {
  mittNavn = localStorage.navn;
}

/* Lytter for endringer i databasen */
db.collection("meldinger").onSnapshot((snapshot) => {
  oppdater();
});

/* Funksjonen lager listen med meldinger på nytt */
function oppdater() {
  db.collection("meldinger").orderBy("skrevet").get().then((snapshot) => {
    let dokumenter = snapshot.docs;
    chatVinduEl.innerHTML = ""; /* Tømmer chatVindun med meldinger */

    dokumenter.forEach(dok => {
      visMelding(dok);
    });
    let alleMeldinger = document.querySelectorAll(".chatVindudiv");
    let sisteMelding = alleMeldinger[alleMeldinger.length-1]
    sisteMelding.scrollIntoView({behavior:"smooth", block:"end"});
  });
}

// Funksjon som viser hvert element
function visMelding(dokument) {
let divEl = document.createElement("div");
divEl.setAttribute("class", "chatVindudiv");

/* Lager en div til hver melding */
let divMeldingEl = document.createElement("div");
divMeldingEl.classList.add("melding");
divMeldingEl.dataset.id = dokument.id;
let meldingTekstEl = document.createElement("p");
meldingTekstEl.classList.add("meldingTekst");
meldingTekstEl.innerHTML = dokument.data().navn + ": " + dokument.data().melding;
divMeldingEl.appendChild(meldingTekstEl);
divEl.appendChild(divMeldingEl);


/* 
Hvis du har skrevet meldingen plasseres den til høgre 
Du får også muligheten til å redigere og slette meldigen
*/
if (dokument.data().navn == mittNavn) {
  divEl.classList.add("hogre");
  divMeldingEl.classList.add("minMelding");
  // meldingTekstEl.addEventListener("click", redigerMelding);

  let slettKnappEl = document.createElement("button");
  slettKnappEl.setAttribute("class", "avbryt");
  slettKnappEl.innerHTML = "Slett";
  slettKnappEl.dataset.id = dokument.id;
  slettKnappEl.addEventListener("click", slettMelding);
  /* Legger til sletteknappen i chatVinduet*/
  divEl.appendChild(slettKnappEl);

  let overlayEl = document.createElement("div");
  overlayEl.className = "overlay";
  divMeldingEl.appendChild(overlayEl);
  overlayEl.addEventListener("click", redigerMelding);
}

/* Legger til bilde hvis meldingen har et */
if (dokument.data().bildeUrl) {
  let divBilde = document.createElement("img");
  divBilde.classList.add("bilde");
  divBilde.src = dokument.data().bildeUrl;
  divBilde.alt = dokument.data().bildeNavn;
  divMeldingEl.appendChild(divBilde);

/*     divMeldingEl.removeEventListener("click", redigerMelding);
  divMeldingEl.style.cursor = "auto";
  meldingTekstEl.addEventListener("click", redigerMelding);
  meldingTekstEl.style.cursor = "pointer"; */
}

/* Viser en beskjed på en melding som har blit redigert */
if (dokument.data().redigert) {
  let divRedigertEl = document.createElement("div");
  divRedigertEl.innerHTML = "Denne meldingen ble redigert";
  divRedigertEl.style.fontStyle = "italic";
  divRedigertEl.style.padding = 0;
  divRedigertEl.style.margin = "5px 0 0 10px"
  divMeldingEl.appendChild(divRedigertEl);
}

/* Legger til datoen meldingen ble sendt
Datoen blir hentet fra firebase og konvertert til en enklere versjon
*/
let divDatoEl = document.createElement("div");
let dato = dokument.data().skrevet.toDate();
let month = dato.toLocaleString("default", { month: "short" });

let konvertertDato = "Skrevet: "+dato.getDate()+
        // "/"+(dato.getMonth()+1)+
        " "+month+
        " "+dato.getFullYear()+
        " "+(dato.getHours() < 10 ? "0" : "") + dato.getHours() + 
        ":"+(dato.getMinutes() < 10 ? "0" : "") + dato.getMinutes();
        /* +":"+dato.getSeconds(); */

  divDatoEl.innerHTML = konvertertDato;
  divDatoEl.style.fontStyle = "italic";
  divDatoEl.style.padding = 0;
  divDatoEl.style.margin = "5px 0 0 10px"
  divMeldingEl.appendChild(divDatoEl);

// Legger til elementet på siden
chatVinduEl.appendChild(divEl); 


/* Legger til farge på meldingen */
db.collection("farger").get().then((snapshot) => {
    let dokumenter = snapshot.docs;

    dokumenter.forEach(dok => {
      /* Henter farge dokumentet med navnet på meldingen */
      db.collection("farger").doc(dokument.data().navn).get().then(doc => {
        if (doc.exists) {
          /* Hvis navnet har en farge settes den inn i meldingen */
          db.collection("meldinger").doc(dokument.id).update({
            farge: doc.data().farge
          });
          // divMeldingEl.style.borderColor = doc.data().farge;
          // meldingEl.style.borderColor = doc.data().farge;
        } else {
          /* Hvis navnet ikke har en farge lages en ny */
          let tilfeldigFarge = "hsl(" + Math.floor(Math.random()*360) + ", 100%, 50%)";
          /* Så legges den til i farger med navnet fra medingen */
          db.collection("farger").doc(dokument.data().navn).set({
            farge: tilfeldigFarge
          });
          /* Så legges fargen også inn i meldingen */
          db.collection("meldinger").doc(dokument.id).get().then(mld => {
            if (mld.exists) {
              db.collection("meldinger").doc(dokument.id).update({
                farge: tilfeldigFarge
              });
            }
          });
        }
        divMeldingEl.style.borderColor = dokument.data().farge;
        if (dokument.data().navn == mittNavn) {
          meldingEl.style.borderColor = dokument.data().farge;
        }
        /* 
        Hvis fargen til navnet eksisterer
        legges fargen til rundt meldingen
        */
        // if (doc.exists) {
        //   divMeldingEl.style.borderColor = doc.data().farge;
        //   meldingEl.style.borderColor = doc.data().farge;
        // }
      });
    });
  });
  // divEl.scrollIntoView({behavior:"smooth", block:"end"});
}

/* Funksjonen som sender en melding */
function sendMelding() {
let timestamp = firebase.firestore.FieldValue.serverTimestamp;
db.collection("meldinger").add({
  melding: meldingEl.value,
  navn: mittNavn,
  redigert: false,
  skrevet: timestamp()
});
meldingEl.value = "";
}

/* Funksjonen som sender bilder 
Henter bildet som brukeren har valgt og gir beskjed hvis det ikke er valgt noe
Først lager den en referanse til hvor bildet skal ligge også 
legger den inn bildet i firebase storage.
Så henter den URL-en til bildet og ligger den inn som en string.
*/
function sendBilde() {
let fil = document.querySelector("#bildefil");
let bilde = fil.files[0];
if (!bilde) {
  alert("Ingen fil valgt");
  return;
}
let storageRef = firebase.storage().ref("bilder/" + bilde.name);
storageRef.put(bilde).then(storageRef => {
  console.log(bilde.name);
  fil.value = "";
  let bildeUrl = firebase.storage().ref("bilder/" + bilde.name).getDownloadURL().then(imgUrl => {
    let timestamp = firebase.firestore.FieldValue.serverTimestamp;
    db.collection("meldinger").add({
      melding: meldingEl.value,
      navn: mittNavn,
      redigert: false,
      skrevet: timestamp(),
      bildeUrl: imgUrl,
      bildeNavn: bilde.name
    });
  });
});
}

/* Funksjonen som redigerer en melding
Henter "parent" elementet til teksten i meldingen og setter inn
et input felt nederst i meldingen.
Den gjør også at du ikke kan trykke på andre meldinger mens du redigerer.

*/
function redigerMelding(e) {
/* Henter id-en til elementet */
let meldingEl = e.target.parentNode;
let id = meldingEl.dataset.id;
let targetEl = e.target;
targetEl.style.cursor = "wait";
let alleOverlay= document.querySelectorAll(".overlay");
alleOverlay.forEach(overlay => {
  overlay.removeEventListener("click", redigerMelding);
  if (overlay.parentNode != meldingEl) {
    overlay.style.cursor = "not-allowed";
  }
});

db.collection("meldinger").doc(id).get().then(doc => {
  let gammelMelding = doc.data().melding;
  meldingEl.innerHTML += `<span id="redigerSpan"><input id="nyMelding" type="text" value="${gammelMelding}"> <button class="ok" id="rediger">Rediger</button></span>`
  
  let meldingTekstEl = meldingEl.querySelector(".meldingTekst");
  let redigerSpanEl = document.querySelector("#redigerSpan");
  meldingEl.insertBefore(redigerSpanEl, meldingTekstEl.nextSibling);

  let redigerEl = document.querySelector("#rediger");

  meldingEl.querySelector(".overlay").remove();

  redigerEl.addEventListener("click", endreMelding => {
    let nyMelding = document.querySelector("#nyMelding").value;
    if (nyMelding != gammelMelding) {
      db.collection("meldinger").doc(id).update({
      melding: nyMelding,
      redigert: true
    });
    } else {
      oppdater();
    }
  });
});
}

/* Funksjonen som sletter en melding fra databasen */
function slettMelding(e) {
let id = e.target.dataset.id;
db.collection("meldinger").doc(id).delete();
}

/*   let timestamp = firebase.firestore.FieldValue.serverTimestamp;
let bildeUrl = firebase.storage().ref("bilder/" + bilde.name).getDownloadURL().then(imgUrl => {
  db.collection("meldinger").add({
    melding: meldingEl.value,
    navn: mittNavn,
    redigert: false,
    skrevet: timestamp(),
    bildeUrl: imgUrl
  });
});
console.log(bildeUrl); */