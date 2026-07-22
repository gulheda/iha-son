# 🌌 Find Your Sunshine — an astronomical journey

A cinematic, interactive birthday gift. The visitor opens a **dark universe**
with a single sun and floats through space, visiting a **planet for each chapter
of a friendship**. Every memory discovered brings more light — stars, nebulae,
the sun itself — until the whole galaxy is alive. When every chapter is found,
the sun unlocks and everything resolves into one message:

> _“Sen bana hep gülüm dedin. Ama her gülün açmak için bir güneşe ihtiyacı vardır.
> Ben senin gülünsem, sen de hep benim güneşim olacaksın.”_

Built with **HTML + CSS + vanilla JavaScript + Three.js** (bundled locally, no
build step). Deploys to GitHub Pages / Netlify / Vercel as static files.

---

## ✨ The journey

| Scene | What happens |
|------|---------------|
| **Intro** | Darkness, one bright star: _“Işığı takip et.”_ Tap it to begin. |
| **Travel** | A real 3D solar system. **Drag** to rotate, **scroll/pinch** to zoom, **tap a planet** to fly to it and reveal its memory (photo + words). |
| **Discovery** | Each visit lights another star of progress and brightens the universe. |
| **Sun** | Locked until every chapter is found — then it unlocks and glows. |
| **Finale** | The camera flies into the sun; the most special photo appears inside the light; the rose→sun lines fade in; a **wish becomes a new star**, then the birthday message. |

Secret: type **SUN** or **GÜNEŞ** anywhere for a shooting star. ✨

---

## 📂 File structure

```text
/index.html            → markup & overlays (intro, panel, letter, finale)
/css/style.css         → all styling for the UI floating over the 3D canvas
/js/content.js         → ⭐ ALL your content: names, chapters, letter, messages
/js/universe.js        → the Three.js engine (universe, camera, finale)
/js/audio.js           → generated ambience + optional music + sound effects
/js/vendor/three.min.js→ Three.js (bundled so no CDN is needed)
/assets/images/        → your photos (photo-1 … photo-5)
/assets/audio/         → optional background song
```

---

## 🖊️ How to make it yours — everything is in `js/content.js`

### 1) Names & the main messages
```js
friendName: "Gözde",
fromName:   "Gülheda",
```
`CONFIG` also holds the intro text, the four **finale lines** (the rose→sun
message), the wish prompts and the birthday text. Edit any string.

### 2) The chapters (planets)
Each planet is one chapter. Edit its name, colour, photo and words:
```js
{
  key: "beginning",
  name: "Başlangıç",
  color: "#E8853A",          // the planet's colour
  size: 1.05, orbit: 15, speed: 0.10, phase: 0.2,
  kind: "photo",             // "photo" | "text" | "letter"
  photo: "assets/images/photo-1.png",
  alt:  "İkimiz bir kafede.",
  text: "Her şeyin başladığı gün...",
},
```
- `kind: "photo"` shows a photo + words · `"text"` shows only words ·
  `"letter"` shows a button that opens the letter.
- Add or remove planets freely — the orbits and progress stars adapt.
- **Missing a photo?** A warm placeholder shows automatically, so nothing breaks.

> Photos are only cropped / colour-graded by CSS — faces are **never** altered.

### 3) The photos
Drop images into `assets/images/` and point each chapter's `photo` at them.
Current mapping: `photo-1` café · `photo-2` outside · `photo-3` flowers ·
`photo-4` night · `photo-5` the solo portrait (also shown inside the sun at the
end — set by `CONFIG.sunPhoto`).

### 4) The letter
Edit the `LETTER` array — one line per entry, `""` adds spacing.

### 5) The song (optional)
The site already generates soft ambience. To add a track, drop a file in
`assets/audio/` and set `CONFIG.musicSrc = "assets/audio/song.mp3"`.

---

## ▶️ Run it locally

Use a small static server (needed so the browser can load the local scripts):
```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or:  npx serve .
```
No dependencies, no build step. Three.js is already in `js/vendor/`.

---

## 🚀 Publish

- **GitHub Pages:** Settings → Pages → deploy from your branch, folder `/ (root)`.
- **Netlify:** drag the folder onto app.netlify.com/drop, or connect the repo
  (no build command, publish dir `/`).
- **Vercel:** `vercel` in the folder, framework preset **Other**, no build.

---

## 📱 Mobile & performance

- Touch to rotate, tap planets, pinch to zoom.
- Pixel ratio is capped and star/particle counts drop on touch devices.
- Respects **`prefers-reduced-motion`**, and falls back to a simple view if a
  device has no WebGL — the gift never becomes a blank screen.

---

## ♿ Accessibility

- Every photo has a meaningful `alt`; the letter modal is focus-trapped and
  closes with **Esc**; the sound toggle is always visible; **Esc** also leaves a
  planet.

---

Made with 💛 for a sunshine.
