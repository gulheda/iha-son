/* =============================================================================
   content.js — ALL personal content for the universe.
   -----------------------------------------------------------------------------
   Edit this one file to make the journey your own: names, the chapters
   (planets), their photos and words, the letter, and the closing messages.

   Photos live in assets/images/. If a photo is missing, a warm placeholder is
   shown so nothing ever breaks.
   ========================================================================== */

const CONFIG = {
  friendName: "Gözde",
  fromName:   "Gülheda",

  // Opening (dark space)
  introTitle: "Işığı takip et.",
  introHint:  "başlamak için ışığa dokun",

  // Shown while travelling, before anything is discovered
  travelHint: "Bir gezegene dokun",

  // The final reveal, line by line (the heart of the whole site)
  finaleLines: [
    "Sen bana hep gülüm dedin.",
    "Ama her gülün açmak için bir güneşe ihtiyacı vardır.",
    "Ben senin gülünsem...",
    "...sen de hep benim güneşim olacaksın.",
  ],

  // Wish → becomes a star
  wishButton:   "Son bir sürpriz",
  wishPrompt:   "Evrene bir dilek gönder",
  wishPlaceholder: "Buraya bir dilek yaz...",
  wishSend:     "Evrene gönder",
  birthdayTitle: "İyi ki doğdun.",
  birthdaySub:   "Evrenimdeki en parlak yıldız olduğun için teşekkür ederim.",

  // The single most special photo — appears inside the sun at the end.
  sunPhoto: "assets/images/photo-5.webp",
  sunPhotoAlt: "Gözde",

  musicSrc: "",   // optional: "assets/audio/song.mp3"
};

/* --------------------------------------------------------------- CHAPTERS
   Each planet is one chapter of the friendship. They orbit the central sun.
   color      → the planet's warm/cool identity
   size       → relative radius
   orbit      → distance from the sun
   speed      → orbit speed (small = slow)
   kind       → "photo" | "text" | "letter"
   photo/text → what its panel reveals                                          */
const PLANETS = [
  {
    key: "beginning",
    name: "Başlangıç",
    color: "#E8853A",
    size: 1.05, orbit: 15, speed: 0.10, phase: 0.2,
    kind: "photo",
    photo: "assets/images/photo-1.png",
    alt:  "İkimiz bir kafede.",
    text: "Her şeyin başladığı gün. En sıradan anlar bile, sen yanımda olduğun için anıya dönüştü.",
  },
  {
    key: "laughter",
    name: "Kahkaha",
    color: "#5AA6C7",
    size: 1.25, orbit: 22, speed: 0.072, phase: 1.1,
    kind: "photo",
    photo: "assets/images/photo-2.png",
    alt:  "Dışarıda, güneşli bir günde ikimiz.",
    text: "Seninle gülmek en sevdiğim ses. Dışarıda, güneşin altında, her şey hep biraz daha aydınlıktı.",
  },
  {
    key: "flowers",
    name: "Çiçekler",
    color: "#DDA7A0",
    size: 1.0, orbit: 29, speed: 0.056, phase: 2.4,
    kind: "photo",
    photo: "assets/images/photo-3.webp",
    alt:  "Aynada, elimizde küçük pembe çiçeklerle ikimiz.",
    text: "Sen bana çiçek verdin. Sonra da benim güneşim oldun.",
  },
  {
    key: "home",
    name: "Ev",
    color: "#6FB59A",
    size: 1.35, orbit: 37, speed: 0.043, phase: 3.5,
    kind: "photo",
    photo: "assets/images/photo-4.webp",
    alt:  "Işıkların altında, bir gece.",
    text: "Ev hiçbir zaman bir yer olmadı. Hep sen oldun.",
  },
  {
    key: "dreams",
    name: "Hayaller",
    color: "#8A6FC7",
    size: 1.15, orbit: 45, speed: 0.034, phase: 4.7,
    kind: "text",
    text: "Birlikte yapacağımız o kadar çok şey var. Gezmek, birlikte büyümek, yıllar sonra bu geceyi gülümseyerek anmak. Önümüzde koca bir evren var.",
  },
  {
    key: "letter",
    name: "Mektup",
    color: "#E8B04A",
    size: 1.2, orbit: 54, speed: 0.026, phase: 5.9,
    kind: "letter",
    text: "Sana yazdığım bir mektup var. Açmak için dokun.",
  },
];

/* ------------------------------------------------------------------ LETTER */
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

window.SUNSHINE = { CONFIG, PLANETS, LETTER };
