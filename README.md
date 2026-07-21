# 🌅 Find Your Sunshine

A cinematic, interactive birthday gift — somewhere between a short film and a
game. The visitor opens a **dark screen** and explores with a warm light that
follows their cursor (or finger). Hidden in the darkness are whispered notes and
photo-memories. Finding them all triggers a slow **sunrise**, a **rose** opening
in the light, a handwritten **letter**, and a birthday **finale**.

> _“Turns out, you were always the light.”_

Built with plain **HTML + CSS + vanilla JavaScript** — no build step, no
frameworks. It runs by just opening `index.html`, and deploys to GitHub Pages,
Netlify, or Vercel with zero configuration.

---

## ✨ The experience

| Scene | What happens |
|------|---------------|
| **0 · Intro** | A tiny spark in the dark: _“There is a light hidden somewhere. Find it.”_ |
| **1–3 · The dark field** | A lantern follows the pointer/finger; whispers glow and 7 memory-photos bloom from blur into warmth as you find them. |
| **4 · Sunrise** | Once every memory is found, a slow 6–8s dawn rises with the reveal lines. |
| **5 · Rose** | A rose (SVG, never a filtered face) opens in the sun. _“If I am your rose, you will always be my sun.”_ |
| **6 · Letter** | A full-screen letter opens line by line. |
| **7 · Finale** | _“Happy Birthday, My Sunshine.”_ + a “one last surprise”. |

Small **easter eggs**: type `SUN` anywhere, click the rising sun 5×, tap the
`zzz` in the corner, or double-tap an opened photo. 💛

---

## 📂 File structure

```text
/index.html          → markup & scene scaffolding
/css/style.css       → all styling, the torch effect, animations, responsive
/js/memories.js      → ⭐ ALL your content: names, photos, notes, letter
/js/audio.js         → generated ambience + optional music + sound effects
/js/main.js          → the engine (light, discovery, scenes, easter eggs)
/assets/images/      → put your photos here  (photo-1.jpg … photo-7.jpg)
/assets/audio/       → optional background song
/assets/icons/       → optional icons
```

---

## 🖊️ How to make it yours

**Everything you normally edit lives in `js/memories.js`.** Open it — it is fully
commented.

### 1) Your friend's name & the main messages
At the top of `memories.js`, edit `CONFIG`:
```js
friendName: "[ARKADAŞININ ADI]",   // ← your friend's name
fromName:   "Gülheda",
```
`CONFIG` also holds the intro line, the sunrise/rose lines, the finale text, and
the Turkish messages. Change any string you like.

### 2) The photos
Drop your real images into `assets/images/` and point each memory at them:
```js
const memories = [
  { image: "assets/images/photo-1.jpg", title: "The café",
    text: "The simplest days became memories because you were there.",
    alt: "The two of us at a café.", x: 20, y: 30 },
  // ...
];
```
- `x` / `y` are **screen percentages (0–100)** — where the memory hides.
- `alt` is the accessibility description (please keep it meaningful).
- **Missing a photo?** A warm placeholder shows automatically, so the site never
  breaks — just replace the file later and it appears.

> **About the photos:** they are only cropped, scaled and colour-graded by CSS
> (grayscale → warm as they reveal). Faces are **never** altered or regenerated.

### 3) The letter
Also in `memories.js`, edit the `LETTER` array — one line per entry, empty
strings (`""`) add spacing:
```js
const LETTER = [
  "Canım güneşim,",
  "",
  "Sen bana hep gülüm dedin. ...",
];
```

### 4) The song (optional)
The site already generates a soft ambient bed, so **music is optional**. To add a
track, drop a file in `assets/audio/` and set the path in `CONFIG`:
```js
musicSrc: "assets/audio/song.mp3",
```
Leave it as `""` to use only the generated ambience. Sound starts after the
first interaction (browser rule) and can be muted anytime via the top-right
button.

---

## ▶️ Run it locally

Because the site loads images and scripts, use a tiny local server (opening the
file directly also works, but a server avoids any browser file restrictions):

```bash
# Python 3
python3 -m http.server 8000
# then open  http://localhost:8000

# …or Node
npx serve .
```

No dependencies, no build step.

---

## 🚀 Publish it

### GitHub Pages
1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages** → *Build from a branch* → pick your branch, folder `/ (root)`.
3. Your site goes live at `https://<username>.github.io/<repo>/`.

### Netlify
1. Drag-and-drop the project folder onto <https://app.netlify.com/drop>, **or**
2. Connect the repo — no build command needed, publish directory `/`.

### Vercel
1. `npm i -g vercel` → `vercel` in the project folder, **or**
2. Import the repo on <https://vercel.com>. Framework preset: **Other**. No build
   command, output directory `./`.

---

## 📱 Testing on mobile

- The light follows **touch** instead of the mouse; tap or drag to explore.
- Best tested at phone widths (e.g. 390×844 / 393×852 / 430×932).
- Quick way: run the local server, find your computer's LAN IP, and open
  `http://<your-ip>:8000` on your phone (same Wi-Fi). Or use your browser's
  device-emulation / responsive mode.

---

## ♿ Accessibility & performance

- Every photo has a meaningful `alt`; memory orbs are focusable buttons and open
  with **Enter/Space**.
- The letter modal has a **focus trap** and closes with **ESC** or the backdrop.
- The sound toggle is always visible.
- Respects **`prefers-reduced-motion`**: heavy animations and particles are
  reduced or skipped.
- Photos load on demand; animations use `transform`/`opacity`; particle counts
  stay modest for low-power devices.

---

Made with 💛 for a sunshine.
