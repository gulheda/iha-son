/* =============================================================================
   memories.js — ALL personal content lives here.
   -----------------------------------------------------------------------------
   This is the only file you normally need to edit to make the site your own:
     • CONFIG      → names, titles, the main messages
     • memories[]  → the hidden photos + notes discovered in the dark
     • whispers[]  → the small lines that float in the darkness
     • LETTER      → the letter shown in Scene 6

   Photos: drop your real images into  assets/images/  and point each memory's
   `image` field at them (e.g. "assets/images/photo-1.png"). If a photo is
   missing, a warm placeholder is shown automatically so the experience still
   works — nothing is ever left as an empty box.
   ========================================================================== */

/* ------------------------------------------------------------------ CONFIG */
const CONFIG = {
  // The person this gift is for. Change this to your friend's name.
  friendName: "Gözde",

  // The maker (you).
  fromName: "Gülheda",

  // Intro screen (Scene 0)
  introLine:  "There is a light hidden somewhere.",
  introHint:  "Find it.",

  // Sunrise reveal (Scene 4) — shown one after another.
  sunriseLines: [
    "I thought I was looking for the light.",
    "But it was with me all along.",
  ],
  sunriseFinal: "Turns out, you were always the light.",

  // Rose metaphor (Scene 5)
  roseLines: [
    "You always called me your rose.",
    "But every rose needs a sun.",
    "If I am your rose, you will always be my sun.",
  ],
  roseLineTR:
    "Sen bana hep gülüm dedin. Ama her gülün açmak için bir güneşe ihtiyacı vardır. Benim güneşim sensin.",

  // Letter button (Scene 6)
  letterButton: "A letter for my sunshine",

  // Birthday finale (Scene 7)
  finaleTitle:    "Happy Birthday, My Sunshine.",
  finaleSubtitle: "Thank you for making my world brighter.",
  finaleTR:       "İyi ki doğdun, iyi ki benim güneşim oldun.",
  surpriseLine:   "In every lifetime, I would still choose you as my best friend.",

  // Background music (optional). Drop a file in assets/audio/ and set the path,
  // e.g. "assets/audio/song.mp3". Leave "" to use only the generated ambience.
  musicSrc: "",

  // Hint appears after this many seconds of no discovery.
  hintDelayMs: 12000,
};

/* --------------------------------------------------------------- MEMORIES
   Each memory is a hidden point of light in the dark field.
   x / y are percentages of the screen (0–100) where the orb hides.
   Reveal them by moving your light over them.

   To swap a photo: change `image`. To change words: change `text` / `title`.
   You can add or remove entries — the progress dots adapt automatically.        */
const memories = [
  {
    // photo-1.png  →  the CAFÉ photo (the two of you at a table with iced drinks)
    image: "assets/images/photo-1.png",
    title: "The café",
    text:  "The simplest days became memories because you were there.",
    alt:   "The two of us at a café with our drinks.",
    x: 50, y: 30,
  },
  {
    // photo-2.png  →  the OUTDOOR selfie (sunny day in the park, sunglasses)
    image: "assets/images/photo-2.png",
    title: "Out in the world",
    text:  "Every place felt brighter with you.",
    alt:   "A sunny selfie of us outside in the park.",
    x: 22, y: 33,
  },
  {
    // photo-3.webp →  the FLOWERS photo (mirror selfie holding the little pink flowers)
    image: "assets/images/photo-3.webp",
    title: "The flowers",
    text:  "You gave me flowers. You became the sunlight.",
    alt:   "The two of us in a mirror, holding little pink flowers.",
    x: 76, y: 26,
  },
  {
    // photo-4.webp →  the NIGHT-OUT photo (Gözde in the fur coat under the string lights)
    image: "assets/images/photo-4.webp",
    title: "The warm night",
    text:  "Even the darkest places felt warm with you.",
    alt:   "Gözde under warm string lights on a night out.",
    x: 30, y: 64,
  },
  {
    // photo-5.webp →  the SOLO portrait of Gözde (this also becomes the finale backdrop)
    image: "assets/images/photo-5.webp",
    title: "The light all along",
    text:  "I kept looking for the light — and there you were.",
    alt:   "A portrait of Gözde in the soft daylight.",
    x: 72, y: 62,
  },
];

/* ---------------------------------------------------------------- WHISPERS
   Faint lines that live in the darkness. They glow only when your light
   passes over them — little breadcrumbs that set the mood.                     */
const whispers = [
  { text: "Some people enter your life quietly.",     x: 44, y: 16 },
  { text: "And somehow, everything becomes warmer.",  x: 58, y: 82 },
  { text: "Keep looking. Warmth hides in the dark.",  x: 12, y: 84 },
];

/* ------------------------------------------------------------------ LETTER
   The letter, shown line by line. Edit freely. Blank strings become spacing.   */
const LETTER = [
  "Canım güneşim,",
  "",
  "Sen bana hep gülüm dedin. Belki de bu yüzden sana verebileceğim en doğru isim güneşim.",
  "Çünkü ben hayatımda ne zaman yorulsam, kararsam veya kendimi eksik hissetsem, sen her şeyi biraz daha sıcak, biraz daha kolay hâle getirdin.",
  "",
  "Seninle geçirdiğim sıradan bir gün bile, sonradan hatırlamak isteyeceğim bir anıya dönüşüyor.",
  "Bazen birlikte çok gülüyoruz. Bazen sadece yan yana oturuyoruz. Bazen de yol boyunca uyuyorsun. Ama bütün o anların içinde benim için değişmeyen tek bir şey var: İyi ki yanımdasın.",
  "",
  "Bana kendimi değerli hissettirdiğin, her hâlimi sevdiğin ve hayatıma ışık olduğun için teşekkür ederim.",
  "Sen benim sadece en yakın arkadaşım değilsin. Ev gibi hissettiren, karanlıkta yönümü bulmamı sağlayan ve iyi ki dediğim en güzel insanlardan birisin.",
  "",
  "İyi ki doğdun.",
  "İyi ki hayatıma doğdun.",
  "Seni çok seviyorum.",
];

/* Expose everything to the other scripts (they run as plain <script> files). */
window.SUNSHINE = { CONFIG, memories, whispers, LETTER };
