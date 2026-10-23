# Sito del matrimonio di Monica e Federico

Sito statico (HTML, CSS, JS puro, senza build) per il matrimonio del 28 maggio 2027. Contenuti solo in italiano.

File principali:

- `index.html` (home) e `conferma.html` (pagina di conferma della presenza), le pagine del sito
- `css/styles.css`, gli stili
- `js/main.js`, gli script (incluso il form RSVP)
- `rsvp/apps-script.gs`, lo script Google Apps Script per il backend dell'RSVP

## Come vederlo in locale

Basta aprire `index.html` direttamente nel browser.

In alternativa, dalla cartella del progetto:

```
python3 -m http.server 8000
```

e poi visitare `http://localhost:8000` nel browser.

## Come pubblicarlo online

### GitHub Pages

1. Creare un repository su GitHub e fare il push dei file del progetto.
2. Nel repository, andare su Settings, poi Pages.
3. In "Branch" selezionare `main` e cartella `/root`, quindi salvare.
4. Dopo qualche minuto il sito sara' disponibile all'URL indicato da GitHub.

### Netlify (alternativa)

1. Aprire Netlify e trascinare la cartella del progetto nell'area di deploy (drag and drop).
2. Netlify pubblica il sito e fornisce un URL, senza bisogno di repository o comandi.

## RSVP

Il modulo e' attivo: in `js/main.js` la costante `RSVP_ENDPOINT` contiene gia' l'URL dell'app web di Google Apps Script. Per metterlo in pausa basta `RSVP_ENABLED = false`: al posto del modulo compare la frase "sara' disponibile a breve".

Il modulo chiede: nome, se si partecipa ("Si', ci saremo" o "No, purtroppo non potremo esserci"), e solo per chi viene adulti, bambini, nomi degli adulti, nomi ed eta' dei bambini (compare se i bambini sono piu' di zero) e intolleranze. Il messaggio e' per tutti.

Le risposte finiscono nella scheda "Conferme" del Google Sheet (creata da sola alla prima risposta), con le colonne: Timestamp, Nome, Presenza, Adulti, Bambini, Accompagnatori, Bambini: nomi ed eta', Intolleranze, Messaggio. Per ogni risposta arriva un'email ("Ci sara'" o "Non ci sara'" nell'oggetto).

Impostazioni:

- `RSVP_DEADLINE` in `js/main.js`: solo testo, sostituisce "febbraio 2027" nella frase "fateci sapere se ci sarete entro ...". Il giorno preciso non e' ancora deciso: va definito prima di valorizzarla. Non chiude il modulo in automatico.
- `IBAN` e `IBAN_INTESTATARIO` in `js/main.js`: finche' uno dei due e' vuoto il riquadro IBAN e il pulsante Copia IBAN restano nascosti.
- `NOTIFY_EMAIL` in `rsvp/apps-script.gs`: l'indirizzo che riceve le notifiche. Se vuota, le email arrivano all'account Google con cui e' stato distribuito lo script.

### Aggiornare lo script (mantenendo lo stesso URL)

Ogni modifica a `rsvp/apps-script.gs` va copiata nel progetto Apps Script e ridistribuita, altrimenti l'app web continua a usare la versione precedente:

1. Aprire il Google Sheet, poi Estensioni, poi Apps Script.
2. Sostituire tutto il codice con il contenuto di `rsvp/apps-script.gs` e salvare.
3. Distribuisci, poi Gestisci distribuzioni. Sulla distribuzione esistente cliccare la matita, in "Versione" scegliere "Nuova versione" e confermare.

Cosi' l'URL resta lo stesso e non serve toccare `js/main.js`. Se invece si crea una "Nuova distribuzione", Google genera un URL diverso, che va poi incollato in `RSVP_ENDPOINT`.

### Prima installazione (da zero)

1. Creare un nuovo Google Sheet, vuoto.
2. Nel foglio, aprire Estensioni, poi Apps Script.
3. Cancellare il codice di esempio e incollare il contenuto di `rsvp/apps-script.gs`.
4. Salvare, poi Distribuisci, quindi Nuova distribuzione, di tipo "App web".
5. In "Esegui come" selezionare "Me". In "Chi ha accesso" selezionare "Chiunque".
6. Confermare e copiare l'URL dell'app web in `RSVP_ENDPOINT` in `js/main.js`.

Alla prima esecuzione Google chiede di autorizzare lo script ad accedere al foglio e a inviare email: va accettato con l'account proprietario del foglio.

### Test

Aprendo l'URL dell'app web nel browser deve comparire `{"ok":true,"service":"rsvp"}`.

## Foto

Le foto della galleria sono in `assets/img/` (file rinominati per soggetto: `mare.jpg`, `parigi.jpg`, ecc.) e sono collegate in `index.html` nella sezione `#galleria`. La galleria e' una sola riga a tutta larghezza che scorre in orizzontale da sola (3 foto intere su desktop, 1 su mobile); si ferma al passaggio del mouse o al tocco e si puo' trascinare o scorrere a mano. La logica e' in `js/main.js` (sezione "Galleria"), lo stile in `css/styles.css` (`.carousel`). Per aggiungere o togliere una foto basta aggiungere o rimuovere un `<figure class="carousel__item">`: il ciclo infinito si adatta da solo.

## Animazione iniziale

Aprendo la home compare la busta della partecipazione: nomi in corsivo, arco con le cornici, sigillo di ceralacca verde col monogramma "M F". Al tocco (o con Invio) il sigillo si spezza, le due ante si aprono sulla fodera verde, dalla tasca sale il biglietto con "M F" tra due cuori e la data, poi la busta svanisce e parte l'hero. Esc la salta.

- Compare una volta per sessione (si rivede chiudendo la scheda e riaprendo il sito) e non compare se si arriva su un'ancora, ad esempio `index.html#programma` dalla pagina di conferma.
- Con "riduci movimento" attivo nel sistema, al tocco la busta svanisce e basta.
- Markup in cima a `index.html` (`#intro`), stile in `css/styles.css` (sezione "Intro"), logica in `js/main.js` (sezione "Intro"). Lo script inline nell'head decide se mostrarla.

## Disegni

I disegni sono quelli della partecipazione e stanno in `assets/img/disegni/`, in WebP con lo sfondo trasparente:

- `coppia.webp`, con i due cuori, in cima all'hero; `fiori-prato.webp` e `fiori-mazzo.webp` ai suoi piedi
- `libri.webp` accanto al titolo della storia
- `ramo-lilla.webp` sul bordo dello schermo all'inizio di programma e regali. Da 980px in su scende accanto alla colonna stretta, sotto sta a cavallo tra due sezioni, nello spazio vuoto, cosi' non copre mai il testo
- `cuore.webp` anche ai lati del conto alla rovescia, sopra i regali, accanto a "Ci sarete?" e al titolo della pagina di conferma, ai lati dei nomi nel footer
- `fiori-mazzo.webp` in fondo alla linea del programma, due `margherita.webp` sotto la cerimonia in "I luoghi"
- `fiori-prato.webp`, `cuore.webp` e `libri-occhiali.webp` in fondo al footer, in tutte e due le pagine

Sono ritagliati dai fogli originali di Procreate. Il bianco attorno ai disegni e' trasparente, quello dentro (facce, mani, pagine, petali) e' rimasto bianco.

## Anteprima e icone

- `assets/img/anteprima.jpg` (1200x630) e' l'immagine che compare condividendo il link, ad esempio su WhatsApp. Quando il sito avra' il suo indirizzo definitivo conviene mettere l'URL completo in `og:image` (es. `https://.../assets/img/anteprima.jpg`): alcune app non leggono gli indirizzi relativi.
- `assets/img/favicon.png` e `assets/img/apple-touch-icon.png` sono l'icona della scheda e della schermata Home, ricavate dal cuore.

## Cose ancora da definire (TBD)

- Orari di aperitivo, pranzo, torta e festa (per ora solo la cerimonia ha l'orario: 11:00)
- Giorno preciso di scadenza dell'RSVP (agli invitati si dice "entro febbraio 2027", `RSVP_DEADLINE`)
- IBAN reale e intestatario (`IBAN`, `IBAN_INTESTATARIO`; niente lista nozze)
- Verifica a vista dei due link "Come arrivare" su Google Maps prima della pubblicazione

Contatti: per scelta il sito non ne mostra (niente email, telefono o WhatsApp).
