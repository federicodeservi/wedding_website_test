/**
 * RSVP - Monica e Federico, 28 maggio 2027
 * Google Apps Script che riceve le conferme dal form e le scrive su Google Sheet.
 * Distribuire come App web: Esegui come "Me", Accesso "Chiunque".
 */

// Email che riceve la notifica per ogni nuova conferma.
// Se lasciata vuota, si usa Session.getEffectiveUser().getEmail() (l'account che ha distribuito lo script).
const NOTIFY_EMAIL = "";

// Nome delle colonne, nell'ordine in cui vengono scritte sul foglio.
var HEADERS = ['Timestamp', 'Nome', 'Persone', 'Accompagnatori', 'Bambini', 'Età bambini', 'Intolleranze', 'Messaggio'];

/**
 * Ping di controllo: utile per verificare che la distribuzione funzioni.
 */
function doGet(e) {
  return jsonResponse({ ok: true, service: 'rsvp' });
}

/**
 * Riceve la conferma RSVP (JSON o form-encoded) e la aggiunge al foglio.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // evita scritture concorrenti sullo stesso foglio

    var data = parseRequest(e);

    // Honeypot anti-spam: se il campo "website" e' compilato, si finge tutto ok senza scrivere.
    if (data.website) {
      return jsonResponse({ ok: true });
    }

    var nome = String(data.nome || '').trim();
    if (!nome) {
      return jsonResponse({ ok: false, error: 'Il nome e\' obbligatorio.' });
    }

    var persone = parseInt(data.persone, 10);
    if (isNaN(persone) || persone < 1) {
      persone = 1;
    }

    var accompagnatori = String(data.accompagnatori || '').trim();
    var bambini = String(data.bambini || '').trim();
    var etaBambini = String(data.eta_bambini || '').trim();
    var intolleranze = String(data.intolleranze || '').trim();
    var messaggio = String(data.messaggio || '').trim();

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Se il foglio e' vuoto, scrive prima l'intestazione.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    sheet.appendRow([
      new Date(),
      nome,
      persone,
      accompagnatori,
      bambini,
      etaBambini,
      intolleranze,
      messaggio
    ]);

    // Invia una notifica via email; un eventuale errore non deve bloccare la risposta.
    try {
      inviaNotificaEmail({
        nome: nome,
        persone: persone,
        accompagnatori: accompagnatori,
        bambini: bambini,
        etaBambini: etaBambini,
        intolleranze: intolleranze,
        messaggio: messaggio
      });
    } catch (mailErr) {
      // Nessuna azione: la conferma e' comunque salvata sul foglio.
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Invia l'email di notifica con tutti i dati della conferma appena ricevuta.
 */
function inviaNotificaEmail(dati) {
  var destinatario = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  var url = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  var corpo = [
    'Nome: ' + dati.nome,
    'Persone: ' + dati.persone,
    'Accompagnatori: ' + dati.accompagnatori,
    'Bambini: ' + dati.bambini,
    'Eta\' bambini: ' + dati.etaBambini,
    'Intolleranze: ' + dati.intolleranze,
    'Messaggio: ' + dati.messaggio,
    '',
    'Foglio Google: ' + url
  ].join('\n');

  MailApp.sendEmail({
    to: destinatario,
    subject: 'Nuova conferma: ' + dati.nome + ' (' + dati.persone + ' persone)',
    body: corpo
  });
}

/**
 * Legge i parametri sia da JSON (e.postData.contents) sia da form-encoded (e.parameter).
 */
function parseRequest(e) {
  if (e && e.postData && e.postData.type === 'application/json' && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // Se il parsing JSON fallisce, prova con i parametri di form.
    }
  }
  return (e && e.parameter) || {};
}

/**
 * Costruisce una risposta JSON con il MIME type corretto.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
