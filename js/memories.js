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
  introLine:  "Bir yerlerde saklı bir ışık var.",
  introHint:  "Onu bul.",

  // Sunrise reveal (Scene 4) — shown one after another.
  sunriseLines: [
    "Işığı aradığımı sanıyordum.",
    "Ama o hep yanı başımdaydı.",
  ],
  sunriseFinal: "Meğer o ışık, hep senmişsin.",

  // Rose metaphor (Scene 5)
  roseLines: [
    "Sen bana hep gülüm dedin.",
    "Ama her gülün açmak için bir güneşe ihtiyacı vardır.",
    "Ben senin gülünsem, sen de hep benim güneşim olacaksın.",
  ],
  roseLineTR: "İyi ki varsın, güneşim.",   // small handwritten closer under the rose

  // Letter button (Scene 6)
  letterButton: "Güneşime bir mektup",

  // Birthday finale (Scene 7)
  finaleTitle:    "İyi ki doğdun, güneşim.",
  finaleSubtitle: "Dünyamı aydınlattığın için teşekkür ederim.",
  finaleTR:       "İyi ki doğdun, iyi ki benim güneşim oldun.",
  surpriseLine:   "Her hayatta yine seni en yakın arkadaşım olarak seçerdim.",

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
    title: "O kafe",
    text:  "En sıradan günler bile, sen yanımda olduğun için anıya dönüştü.",
    alt:   "İkimiz bir kafede, içeceklerimizle.",
    x: 50, y: 30,
  },
  {
    // photo-2.png  →  the OUTDOOR selfie (sunny day in the park, sunglasses)
    image: "assets/images/photo-2.png",
    title: "Dışarıda",
    text:  "Seninle her yer daha aydınlıktı.",
    alt:   "Dışarıda, güneşli bir günde ikimiz.",
    x: 22, y: 33,
  },
  {
    // photo-3.webp →  the FLOWERS photo (mirror selfie holding the little pink flowers)
    image: "assets/images/photo-3.webp",
    title: "Çiçekler",
    text:  "Sen bana çiçek verdin. Sonra da güneşim oldun.",
    alt:   "Aynada, elimizde küçük pembe çiçeklerle ikimiz.",
    x: 76, y: 26,
  },
  {
    // photo-4.webp →  the NIGHT-OUT photo (Gözde in the fur coat under the string lights)
    image: "assets/images/photo-4.webp",
    title: "O sıcak gece",
    text:  "En karanlık yerler bile seninle sımsıcaktı.",
    alt:   "Işıkların altında, bir gece Gözde.",
    x: 30, y: 64,
  },
  {
    // photo-5.webp →  the SOLO portrait of Gözde (this also becomes the finale backdrop)
    image: "assets/images/photo-5.webp",
    title: "Baştan beri o ışık",
    text:  "Hep ışığı aradım — ve karşımda hep sen vardın.",
    alt:   "Yumuşak gün ışığında Gözde'nin portresi.",
    x: 72, y: 62,
  },
];

/* ---------------------------------------------------------------- WHISPERS
   Faint lines that live in the darkness. They glow only when your light
   passes over them — little breadcrumbs that set the mood.                     */
const whispers = [
  { text: "Bazı insanlar hayatına sessizce girer.",   x: 44, y: 16 },
  { text: "Ve bir bakmışsın, her şey daha sıcak.",     x: 58, y: 82 },
  { text: "Aramaya devam et. Sıcaklık karanlıkta saklı.", x: 12, y: 84 },
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
