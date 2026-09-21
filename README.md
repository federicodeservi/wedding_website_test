# Sito del matrimonio di Monica e Federico

Sito statico (HTML, CSS, JS puro, senza build) per il matrimonio del 28 maggio 2027. Contenuti solo in italiano.

File principali:

- `index.html (home) e conferma.html (pagina RSVP)`, la pagina del sito
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

## Attivare l'RSVP

Il form RSVP e' attualmente in pausa sul sito. Per attivarlo:

1. Creare un nuovo Google Sheet, vuoto.
2. Nel foglio, aprire Estensioni, poi Apps Script.
3. Cancellare il codice di esempio e incollare il contenuto di `rsvp/apps-script.gs`.
4. Salvare il progetto, poi cliccare su Distribuisci, quindi Nuova distribuzione.
5. Scegliere il tipo "App web".
6. In "Esegui come" selezionare "Me". In "Chi ha accesso" selezionare "Chiunque".
7. Confermare la distribuzione e copiare l'URL dell'app web generato.
8. Incollare l'URL in `js/main.js` nella costante `RSVP_ENDPOINT`. Il modulo compare da solo appena `RSVP_ENDPOINT` contiene l'URL.
9. Impostare, se si vuole, la data limite per rispondere nella costante `RSVP_DEADLINE` (opzionale: se lasciata vuota, il sito mostra una frase generica).
10. Impostare, se si vuole, `NOTIFY_EMAIL` in `rsvp/apps-script.gs` con l'indirizzo che deve ricevere le notifiche delle conferme. Se lasciata vuota, le email arrivano all'account Google con cui e' stato distribuito lo script.

Note:

- Ogni volta che si modifica lo script serve creare una nuova distribuzione (non basta salvare), altrimenti l'app web continua a usare la versione precedente.
- Alla prima esecuzione, Google chiedera' di autorizzare lo script ad accedere al foglio e a inviare email a nome dell'account: e' un passaggio normale, va accettato con l'account Google proprietario del foglio.
- Il foglio Google Sheet viene creato con le colonne: Timestamp, Nome, Persone, Accompagnatori, Bambini, Eta' bambini, Intolleranze, Messaggio.

### Test

Dopo aver distribuito l'app web, aprire l'URL generato nel browser: deve mostrare `{"ok":true,"service":"rsvp"}`.

## Foto

Le foto della galleria sono in `assets/img/` (file rinominati per soggetto: `mare.jpg`, `parigi.jpg`, ecc.) e sono collegate in `index.html` nella sezione `#galleria`. La galleria e' una sola riga a tutta larghezza che scorre in orizzontale da sola (3 foto intere su desktop, 1 su mobile); si ferma al passaggio del mouse o al tocco e si puo' trascinare o scorrere a mano. La logica e' in `js/main.js` (sezione "Galleria"), lo stile in `css/styles.css` (`.carousel`). Per aggiungere o togliere una foto basta aggiungere o rimuovere un `<figure class="carousel__item">`: il ciclo infinito si adatta da solo.

La foto dell'hero usa ancora un segnaposto di picsum.photos: per sostituirla, mettere il file in `assets/img/` e aggiornare il `src` di `.hero__img` in `index.html`.

## Cose ancora da definire (TBD)

- Chiesa (luogo e orario della cerimonia)
- Scaletta della giornata
- Data limite per rispondere all'RSVP
- IBAN o lista nozze
- Testo della storia della coppia
- Contatti da mostrare agli invitati
