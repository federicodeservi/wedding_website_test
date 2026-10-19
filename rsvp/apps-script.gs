/**
 * RSVP - Monica e Federico, 28 maggio 2027
 * Google Apps Script che riceve le conferme dal form e le scrive su Google Sheet.
 * Distribuire come App web: Esegui come "Me", Accesso "Chiunque".
 */

// Email che riceve la notifica per ogni nuova conferma.
// Se lasciata vuota, si usa Session.getEffectiveUser().getEmail() (l'account che ha distribuito lo script).
const NOTIFY_EMAIL = "";

// Scheda del Google Sheet su cui vengono scritte le conferme (creata da sola se non esiste).
var SHEET_NAME = 'Conferme';

// Nome delle colonne, nell'ordine in cui vengono scritte sul foglio.
var HEADERS = ['Timestamp', 'Nome', 'Presenza', 'Adulti', 'Bambini', 'Accompagnatori', 'Bambini: nomi ed età', 'Intolleranze', 'Messaggio'];

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

    var presenza = String(data.presenza || '').trim();
    if (presenza !== 'si' && presenza !== 'no') {
      return jsonResponse({ ok: false, error: 'Indicare se si partecipa.' });
    }
    var viene = presenza === 'si';

    // Chi non viene non manda i dettagli: adulti e bambini restano a zero.
    var adulti = viene ? parseInt(data.adulti, 10) : 0;
    if (viene && (isNaN(adulti) || adulti < 1)) {
      adulti = 1;
    }
    var bambini = viene ? parseInt(data.bambini, 10) : 0;
    if (isNaN(bambini) || bambini < 0) {
      bambini = 0;
    }

    var accompagnatori = String(data.accompagnatori || '').trim();
    var etaBambini = String(data.eta_bambini || '').trim();
    var intolleranze = String(data.intolleranze || '').trim();
    var messaggio = String(data.messaggio || '').trim();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Se il foglio e' vuoto, scrive prima l'intestazione.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      nome,
      viene ? 'Sì' : 'No',
      adulti,
      bambini,
      accompagnatori,
      etaBambini,
      intolleranze,
      messaggio
    ]);

    // Invia una notifica via email; un eventuale errore non deve bloccare la risposta.
    try {
      inviaNotificaEmail({
        nome: nome,
        viene: viene,
        adulti: adulti,
        bambini: bambini,
        accompagnatori: accompagnatori,
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
    'Presenza: ' + (dati.viene ? 'Sì' : 'No'),
    'Adulti: ' + dati.adulti,
    'Bambini: ' + dati.bambini,
    'Accompagnatori: ' + dati.accompagnatori,
    'Bambini, nomi ed eta\': ' + dati.etaBambini,
    'Intolleranze: ' + dati.intolleranze,
    'Messaggio: ' + dati.messaggio,
    '',
    'Foglio Google: ' + url
  ].join('\n');

  var oggetto = dati.viene
    ? 'Ci sara\': ' + dati.nome + ' (' + dati.adulti + ' adulti, ' + dati.bambini + ' bambini)'
    : 'Non ci sara\': ' + dati.nome;

  MailApp.sendEmail({
    to: destinatario,
    subject: oggetto,
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
