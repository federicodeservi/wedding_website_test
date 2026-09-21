/* Monica & Federico: interazioni leggere, nessuna dipendenza. */

/* ---------- Configurazione ---------- */
const WEDDING_DATE = new Date("2027-05-28T15:30:00+02:00");
const RSVP_ENABLED = true;               // interruttore generale
const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzOvQfZpT7rVe7kNnAsOIW-kkHmzF2tc8hV1a3neB90lyq1hm7X_tJUjuC7za31M_je/exec";                // URL della web app Apps Script (vedi README). Finche' e' vuoto il sito mostra "in arrivo".
const RSVP_DEADLINE = "";                // es. "30 aprile 2027". Se vuoto, nessuna data nel form.

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
const copyBtn = document.getElementById("copyIban");
const ibanEl = document.getElementById("ibanValue");
if (copyBtn && ibanEl) copyBtn.addEventListener("click", async () => {
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

if (form && RSVP_ENABLED && RSVP_ENDPOINT) {
  paused.hidden = true;
  form.hidden = false;

  if (RSVP_DEADLINE) {
    form.querySelector("[data-rsvp-deadline]").textContent = RSVP_DEADLINE;
    form.querySelector("[data-rsvp-deadline-wrap]").hidden = false;
  }

  /* Il campo eta' compare solo se ci sono bambini */
  const bambini = form.querySelector("#bambini");
  const etaField = document.getElementById("etaBambiniField");
  const syncBambini = () => { etaField.hidden = !(Number(bambini.value) > 0); };
  bambini.addEventListener("input", syncBambini);
  syncBambini();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nomeField = form.querySelector("#nome").closest(".field");
    const nome = form.nome.value.trim();
    nomeField.classList.toggle("is-invalid", !nome);
    if (!nome) { form.nome.focus(); return; }

    submitBtn.disabled = true;
    status.textContent = "Invio in corso...";
    status.className = "form__status";

    try {
      const body = new URLSearchParams(new FormData(form));
      const res = await fetch(RSVP_ENDPOINT, { method: "POST", body });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Errore");
      form.reset();
      syncBambini();
      status.textContent = "Grazie! Abbiamo ricevuto la vostra conferma.";
      status.className = "form__status is-ok";
    } catch {
      status.textContent = "Qualcosa e' andato storto. Riprovate o scriveteci direttamente.";
      status.className = "form__status is-err";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
