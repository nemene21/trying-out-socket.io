# Bežične računalne mreže

Danas većina aplikacija i stranica koriste internet kako bi se prebacile razne informacije preko mreže. Bežično prenošenje informacija danas je vrlo **brzo i jeftino** te ga to čini vrlo pogodnim za razne usluge. Koristi se za sve od dobivanja informacija baza podataka, računalnih igara te chatova.

Postoje mnogi protokoli koje programeri koriste kako bi bežično prenosili informacije. Protokoli su algoritmi koji opisuju kako informacije dolaze sa jednog mjesta na drugo. Npr.:
* **HTTP** - Hypertext Transfer Protocol
* **TCP** - Transmission Control Protocol
* **UDP** - User Datagram Protocol

Zadatak projekta je bio izrada male video igre koristeći neki jednostavan *networking* protokol kako bi se istražila dostupnost takve tehnologije učenicima.
Projekt je napravljen u html-u, css-u, *vanilla* JavaScript-u i node.js-u sa socket.io modulom.

Stranicu igre možete naći na linku "https://socket-io-project.netlify.app/" ili skeniranjem QR-koda:

![QR-kod](qr_kod.png)

Socket.io koristi UDP protokol za razmjenu informacija između klijenta i servera. UDP protokol nije idealan za izradu video igara zato što on osigurava da informacije stižu na svoje mjesto što ih usporava, a za neke stvari kao npr. poziciju igrača ne trebamo imati 100% savršene informacije nego klijent može micati poziciju protivnika do najnovije poslane pozicije. No pošto je ovo školski projekt koji neće koristiti više od desetka ljudi, to je sasvim dovoljno.

Povezivanje klijenta na Socket.io server je začuđujuće lako:
```js
const socket = io("https://school-project-lh8g.onrender.com"{     transports: ['websocket']
});
```
A uspostavljivanje servera je još lakše:
```js
const PORT = 3000
const io = require("socket.io")(PORT)
```
Klijenti autonomno šalju informacije o svojoj poziciji, bodovima i animaciji serveru. Iako je to najjednostavnije riješenje za taj problem, nije i najbolje. Klijent može serveru poslati bilo kakvu informaciju, bez obzira na to jeli ona smislena ili ne. Tako da kada bi netko slučajno otvorio konzolu *browsera* i upisao nešto poput `players[socket.id].score = 99999`, vrlo bi lagano potrgao igru. Kako bi se tog problema riješili, programeri često umjesto pozicije igrača šalju *input* igrača te se njegova pozicija kalkulira na serveru, ali to dolazi sa novim problemom, kada neko pritisne gumb za skok, server prima tu informaciju 50 milisekundi te vrača novu poziciju nakon još 50 milisekundi. To se zove *input delay*, kako bi se riješili toga, programeri implementiraju algoritam koji se naziva *client side prediction*. *Client side prediction* dozvoljava da klijent kalkulira svoju poziciju, ali forsira server da provjeri informacije koje šalje igrač ovisno o njegovim *inputima*. Tako se dobije najbolje od oba svijeta, brza reakcija programa na *input* i provjereni potezi igrača.

Održavanje servera je također veliki problem kod izrade online video igara te velike kompanije troše jako puno novca kako bi njihovi serveri preformirali što bolje. Na sreću, danas ima puno ljudi koji nude takvu uslugu besplatno te sam našao stranicu "https://render.com/" na kojoj ima besplatni plan za održavanje servera! Server se također nalazi relativno blizu, u Frankfurtu (oko 900km od Zagreba).

Video igra i njene grafike su vrlo jednostavne jer je naglasak bio na *networkingu*. Projekt sadrži 700 linija koda koji se može naći na linku "https://github.com/nemene21/trying-out-socket.io", a zvučni efekti napravljeni su uz pomoć programa bfxr - "https://www.bfxr.net/". Grafike su nacrtane na ekran uz pomoć *html canvas elementa* te njegovih funkcija za manipulaciju konteksta u kojem su grafike nacrtane.
```js
// Funkcija za crtanje kruga
function circle(x, y, radius, color) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
}
```
```html
<!-- Canvas element -->
<canvas id="display" width=1024 height=600></canvas>
```
Materjali korišteni za učenje Socket.io modula:
* "https://www.youtube.com/watch?v=rxzOqP9YwmM&t=573s"
* "https://www.youtube.com/watch?v=1BfCnjr_Vjg"
* "https://socket.io/"
