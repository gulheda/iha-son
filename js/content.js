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

  // Shown when the sun is tapped before every planet is found
  sunLocked: "Güneşe ulaşmak için önce tüm gezegenleri keşfet",

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
  birthdayTitle: "Doğum günün kutlu olsun, aşk bahçem.",
  birthdaySub:   "Dost kelimesinin en güzel varlığı, dayanağım, güç kaynağım — senin hep yanındayım.",

  // Closing star map (a constellation named for your friend)
  starmapEyebrow: "GÖKYÜZÜNDE, SENİN İÇİN",
  starmapCaption: "Bulduğun her anı bir yıldıza dönüştü. Hepsi birlikte, artık gökyüzünde senin takımyıldızın.",
  starmapClose:   "Her hayatta, yine sen.",

  // Telescope / camera moment
  telescopeAsk:    "Hadi, bir anı ölümsüzleştirelim mi?",
  telescopeOpen:   "Kamerayı aç",
  telescopeShoot:  "Fotoğraf çek",
  telescopeSave:   "Fotoğrafı indir",
  telescopeAgain:  "Tekrar dene",
  telescopeNoCam:  "Kameraya ulaşılamadı. Bu özellik yayınlanmış sitede (kamera izniyle) çalışır.",

  // The single most special photo — appears inside the sun at the end.
  sunPhoto: "assets/images/photo-5.webp",
  sunPhotoAlt: "Gözde",

  // Music (optional — add your own files to assets/audio/ and set the paths).
  //  musicSrc       → plays through the journey  (e.g. "La Vie en Rose")
  //  finaleMusicSrc → plays at the finale/camera (e.g. Ebru Yaşar - Seviyorum Seni)
  musicSrc:       "",   // e.g. "assets/audio/la-vie-en-rose.mp3"
  finaleMusicSrc: "",   // e.g. "assets/audio/seviyorum-seni.mp3"
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
    color: "#C46B2E", style: "rocky",
    size: 1.05, orbit: 15, speed: 0.10, phase: 0.2,
    kind: "photo",
    photo: "assets/images/photo-1.png",
    alt:  "İkimiz bir kafede.",
    text: "İyi ki!!! Seviyoruuum. Merkez yıldızım, güneşim, ayım. 💛",
  },
  {
    key: "laughter",
    name: "Kahkaha",
    color: "#3E7C9C", style: "gas",
    size: 1.25, orbit: 22, speed: 0.072, phase: 1.1,
    kind: "photo",
    photo: "assets/images/photo-2.png",
    alt:  "Dışarıda, güneşli bir günde ikimiz.",
    text: "Sen her şeyin en güzelini hak ediyorsun.",
  },
  {
    key: "flowers",
    name: "Çiçekler",
    color: "#C98B84", style: "rocky", petals: true,
    size: 1.0, orbit: 29, speed: 0.056, phase: 2.4,
    kind: "photo",
    photo: "assets/images/photo-3.webp",
    alt:  "Aynada, elimizde küçük pembe çiçeklerle ikimiz.",
    text: "Ömrümmm Gözdemmm, iyi ki sen. Her anım, iyi ki varsın.",
  },
  {
    key: "home",
    name: "Ev",
    color: "#4E8B77", style: "gas", ring: true,
    size: 1.35, orbit: 37, speed: 0.043, phase: 3.5,
    kind: "photo",
    photo: "assets/images/photo-4.webp",
    alt:  "Işıkların altında, bir gece.",
    text: "Ev hiçbir zaman bir yer olmadı. Hep sen oldun.",
  },
  {
    key: "dreams",
    name: "Evrenim",
    color: "#6E57A6", style: "gas",
    size: 1.15, orbit: 45, speed: 0.034, phase: 4.7,
    kind: "text",
    text: "Bu koskoca galakside milyarlarca yıldız var. Ama benim evrenimi aydınlatan tek bir güneş var: sensin. Işığın hiç sönmesin, hep parlasın. Ben de o ışığın altında, her zaman senin yanında olacağım. İyi ki varsın. Seni çok seviyorum.",
  },
  {
    key: "letter",
    name: "Aşkıma",
    color: "#D9A23E", style: "gas", ring: true,
    size: 1.2, orbit: 54, speed: 0.026, phase: 5.9,
    kind: "letter",
    text: "Sana yazdıklarım var. Açmak için dokun.",
  },
];

/* ------------------------------------------------------------------ LETTER */
const LETTER = [
  "Aşkım,",
  "",
  "İyi günümde de, kötü günümde de, saçma sapan kahkahalar attığımız anlarda da, hiçbir şey konuşmadan yan yana oturduğumuz zamanlarda da... Hep vardın.",
  "",
  "Bunun ne kadar kıymetli olduğunu sana anlatabilecek doğru kelimeleri bulamıyorum. Ama şunu biliyorum; sen olmasaydın hayatım eksik olurdu.",
  "",
  "Umarım yıllar geçse de yine birlikte güleriz, yine yeni anılar biriktiririz. Çünkü benim en sevdiğim anılar, içinde sen olanlar.",
  "",
  "İyi ki doğdun aşkımmm.",
  "İyi ki varsın güneşimmmm.",
  "Seni çok seviyorum.",
];

/* --------------------------------------------------------------- SECRETS
   Hidden stars scattered through space — little easter eggs. Find one and a
   short message appears. Write your own inside jokes / lines here (Turkish).
   `pos` is where the star hides in space; leave these or move them around.     */
const SECRETS = [
  { pos: [-62, 38, -34], color: "#c98b84", text: "Yol boyunca uyuyan sensin ama en güzel anılar hep seninle." },
  { pos: [ 44, 50, -70], color: "#6e57a6", text: "Bir gün mutlaka o yolculuğa birlikte çıkacağız." },
];

window.SUNSHINE = { CONFIG, PLANETS, LETTER, SECRETS };

