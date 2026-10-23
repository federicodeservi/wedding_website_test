/* Monica & Federico: interazioni leggere, nessuna dipendenza. */

/* ---------- Configurazione ---------- */
const WEDDING_DATE = new Date("2027-05-28T11:00:00+02:00");
const RSVP_ENABLED = true;               // interruttore generale
const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzOvQfZpT7rVe7kNnAsOIW-kkHmzF2tc8hV1a3neB90lyq1hm7X_tJUjuC7za31M_je/exec";                // URL della web app Apps Script (vedi README). Finche' e' vuoto il sito mostra "in arrivo".
// Solo testo: sostituisce "febbraio 2027" nell'invito a rispondere. Vuota per scelta: agli invitati si dice "entro febbraio 2027".
const RSVP_DEADLINE = "";
// Chiusura automatica: si risponde fino a tutto il 1 marzo 2027 (ora italiana), poi il modulo lascia il posto al messaggio di chiusura.
const RSVP_CLOSES_AT = new Date("2027-03-02T00:00:00+01:00");
// Dati reali del conto: finche' uno dei due e' vuoto il riquadro IBAN e il pulsante Copia IBAN restano nascosti.
const IBAN = "";                          // es. "IT.. .... ...."
const IBAN_INTESTATARIO = "";             // nome dell'intestatario del conto, come risulta in banca

/* ---------- Intro: la busta della partecipazione ---------- */
/* Al tocco (o Invio) il sigillo si spezza, le ante si aprono, sale il biglietto e la busta svanisce sul sito.
   Esc la salta. Con prefers-reduced-motion la busta svanisce e basta. */
const intro = document.getElementById("intro");
if (intro && document.documentElement.classList.contains("has-intro")) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behind = [".skip", "#nav", "#main", ".footer"].map((s) => document.querySelector(s)).filter(Boolean);
  behind.forEach((el) => { el.inert = true; });
  let started = false;

  const leave = () => {
    intro.classList.add("is-leaving");
    root.classList.remove("has-intro");   // sblocca lo scroll e fa partire l'animazione dell'hero
    behind.forEach((el) => { el.inert = false; });
    try { sessionStorage.setItem("intro-vista", "1"); } catch {}
    window.setTimeout(() => intro.remove(), reduce ? 400 : 1200);
  };
  const open = () => {
    if (started) return;
    started = true;
    if (reduce) { leave(); return; }
    intro.classList.add("is-opening");
    window.setTimeout(leave, 2600);
  };

  intro.addEventListener("click", open);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !started) { started = true; leave(); }
  });
  document.getElementById("introOpen").focus({ preventScroll: true });
}

/* ---------- Menu mobile ---------- */
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const menu = document.getElementById("navMenu");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
  menu.classList.toggle("is-open", open);
  document.body.classList.toggle("nav-open", open);   // blocca lo scroll dietro il menu a tutto schermo
}

toggle.addEventListener("click", () => {
  setMenu(toggle.getAttribute("aria-expanded") !== "true");
});
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    toggle.focus();
  }
});
/* Tornando sopra i 860px il menu resta visibile in linea: si chiude lo stato a tutto schermo. */
window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => {
  if (e.matches) setMenu(false);
});

/* Bordo della barra quando si scorre (sentinella + IntersectionObserver, niente listener di scroll) */
const sentinel = document.querySelector(".nav-sentinel");
new IntersectionObserver(([entry]) => {
  nav.classList.toggle("is-scrolled", !entry.isIntersecting);
}).observe(sentinel);

/* ---------- Countdown ---------- */
const daysEl = document.querySelector("[data-countdown-days]");
const labelEl = document.querySelector("[data-countdown-label]");
function updateCountdown() {
  if (!daysEl || !labelEl) return;
  const now = new Date();
  const diff = Math.ceil((WEDDING_DATE - now) / 86400000);
  if (diff > 1) { daysEl.textContent = diff; labelEl.textContent = "giorni al grande giorno"; }
  else if (diff === 1) { daysEl.textContent = "1"; labelEl.textContent = "giorno al grande giorno"; }
  else if (diff === 0) { daysEl.textContent = "Oggi"; labelEl.textContent = "ci sposiamo"; }
  else { daysEl.textContent = "Grazie"; labelEl.textContent = "a tutti per aver festeggiato con noi"; }
}
updateCountdown();
setInterval(updateCountdown, 60 * 60 * 1000);

/* ---------- Apparizioni allo scroll ---------- */
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* ---------- Galleria: carosello a scorrimento automatico ---------- */
const carousel = document.getElementById("galleryCarousel");
if (carousel) {
  const track = carousel.querySelector(".carousel__track");
  const SPEED = 28; // px al secondo
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Duplica la sequenza una volta: quando lo scroll supera la prima meta' torna indietro di una meta',
  // cosi' la riga sembra infinita in entrambe le direzioni.
  const originals = Array.from(track.children);
  originals.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach((img) => { img.alt = ""; img.loading = "lazy"; });
    track.appendChild(clone);
  });
  const gap = () => parseFloat(getComputedStyle(track).gap) || 0;
  const half = () => originals.reduce((w, el) => w + el.getBoundingClientRect().width, 0) + gap() * originals.length;

  let paused = false;
  let resumeTimer = 0;
  let last = 0;
  let dragging = false, startX = 0, startScroll = 0;
  const pause = () => { paused = true; window.clearTimeout(resumeTimer); };
  const resumeSoon = (ms = 2500) => {
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => { paused = false; last = 0; }, ms);
  };

  const wrap = () => {
    const h = half();
    if (!h) return;
    if (carousel.scrollLeft >= h) carousel.scrollLeft -= h;
    else if (carousel.scrollLeft <= 0 && dragging) carousel.scrollLeft += h;
  };

  const tick = (now) => {
    if (!paused && document.visibilityState === "visible") {
      if (last) carousel.scrollLeft += (SPEED * (now - last)) / 1000;
      last = now;
    } else {
      last = 0;
    }
    wrap();
    window.requestAnimationFrame(tick);
  };
  if (!reduceMotion) window.requestAnimationFrame(tick);

  // Si ferma quando l'utente interagisce, riparte poco dopo.
  carousel.addEventListener("mouseenter", pause);
  carousel.addEventListener("mouseleave", () => resumeSoon(600));
  carousel.addEventListener("focusin", pause);
  carousel.addEventListener("focusout", () => resumeSoon(600));
  carousel.addEventListener("touchstart", pause, { passive: true });
  carousel.addEventListener("touchend", () => resumeSoon(), { passive: true });
  carousel.addEventListener("wheel", () => { pause(); resumeSoon(); }, { passive: true });
  carousel.addEventListener("scroll", wrap, { passive: true });

  // Trascinamento col mouse su desktop.
  carousel.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    dragging = true; startX = e.clientX; startScroll = carousel.scrollLeft;
    carousel.classList.add("is-dragging"); pause();
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    carousel.scrollLeft = startScroll - (e.clientX - startX);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false; carousel.classList.remove("is-dragging"); resumeSoon();
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

/* ---------- Copia IBAN ---------- */
const ibanBox = document.getElementById("iban");
const copyBtn = document.getElementById("copyIban");
const ibanEl = document.getElementById("ibanValue");
if (ibanBox && IBAN && IBAN_INTESTATARIO) {
  ibanEl.textContent = IBAN;
  document.getElementById("ibanHolder").textContent = IBAN_INTESTATARIO;
  ibanBox.hidden = false;
}
if (copyBtn && ibanEl && IBAN && IBAN_INTESTATARIO) copyBtn.addEventListener("click", async () => {
  const text = ibanEl.textContent.replace(/\s+/g, "");
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copiato";
  } catch {
    copyBtn.textContent = "Seleziona e copia";
  }
  setTimeout(() => { copyBtn.textContent = "Copia IBAN"; }, 2200);
});

/* ---------- RSVP ---------- */
const form = document.getElementById("rsvpForm");
const paused = document.getElementById("rsvpPaused");
const status = document.getElementById("rsvpStatus");
const submitBtn = document.getElementById("rsvpSubmit");
const closedBox = document.getElementById("rsvpClosed");
const rsvpClosed = () => new Date() >= RSVP_CLOSES_AT;
function closeRsvp() {
  form.hidden = true;
  paused.hidden = true;
  closedBox.hidden = false;
}

/* Esito dell'invio: la prima riga in grassetto, le altre a capo sotto */
function setStatus(kind, title, ...lines) {
  const strong = document.createElement("strong");
  strong.textContent = title;
  status.replaceChildren(strong, ...lines.flatMap((line) => [document.createElement("br"), line]));
  status.className = "form__status " + kind;
}

if (form && RSVP_ENABLED && RSVP_ENDPOINT && rsvpClosed()) {
  closeRsvp();
} else if (form && RSVP_ENABLED && RSVP_ENDPOINT) {
  paused.hidden = true;
  form.hidden = false;

  if (RSVP_DEADLINE) {
    form.querySelector("[data-rsvp-deadline]").textContent = RSVP_DEADLINE;
    form.querySelector("[data-rsvp-deadline-wrap]").hidden = false;
  }

  /* I dettagli (adulti, bambini, intolleranze) compaiono solo per chi viene. Il fieldset disabilitato non viene inviato. */
  const presenteFields = document.getElementById("presenteFields");
  const presenzaField = document.getElementById("presenzaField");
  const syncPresenza = () => {
    const viene = form.presenza.value === "si";
    presenteFields.hidden = !viene;
    presenteFields.disabled = !viene;
    if (form.presenza.value) presenzaField.classList.remove("is-invalid");
  };
  presenzaField.addEventListener("change", syncPresenza);

  /* Il campo dei bambini (nomi ed eta') compare solo se ci sono bambini */
  const bambini = form.querySelector("#bambini");
  const etaField = document.getElementById("etaBambiniField");
  const syncBambini = () => { etaField.hidden = !(Number(bambini.value) > 0); };
  bambini.addEventListener("input", syncBambini);
  syncPresenza();
  syncBambini();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (rsvpClosed()) { closeRsvp(); return; }   // pagina aperta da prima della scadenza
    const nomeField = form.querySelector("#nome").closest(".field");
    const nome = form.nome.value.trim();
    const presenza = form.presenza.value;
    nomeField.classList.toggle("is-invalid", !nome);
    presenzaField.classList.toggle("is-invalid", !presenza);
    if (!nome) { form.nome.focus(); return; }
    if (!presenza) { form.presenza[0].focus(); return; }

    submitBtn.disabled = true;
    status.textContent = "Invio in corso...";
    status.className = "form__status";

    try {
      const body = new URLSearchParams(new FormData(form));
      const res = await fetch(RSVP_ENDPOINT, { method: "POST", body });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Errore");
      form.reset();
      syncPresenza();
      syncBambini();
      if (presenza === "si") {
        setStatus("is-ok", "Risposta ricevuta", "Che bello, ci sarete!", "Abbiamo ricevuto la vostra risposta e non vediamo l’ora di festeggiare insieme.");
      } else {
        setStatus("is-ok", "Risposta ricevuta", "Grazie per averci avvisato. Ci dispiace non avervi con noi, ci mancherete!");
      }
    } catch {
      setStatus("is-err", "Non siamo riusciti a inviare la risposta.", "Riprovate tra qualche istante. Se il problema continua, riprovate più tardi.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}
