# BgFyer

A simple, black-and-white, browser-based background remover.

## What it does

- Upload, drag-and-drop, or paste JPEG, PNG, and WebP images
- Remove portrait backgrounds locally in the browser
- Preview the original and transparent result
- Export transparent PNG or WebP
- Export JPEG with a white, black, or custom solid background
- No account, no backend, no image uploads, and no watermark

## Important model note

BgFyer V1 uses `Xenova/modnet`, an Apache-2.0 licensed portrait matting model through Hugging Face Transformers.js. It is intentionally lightweight and works best on people and portrait photography. It is not yet optimised for arbitrary products, logos, vehicles, or complex multi-object scenes.

The model is downloaded from Hugging Face when the remover is used for the first time and is then cached by the browser. Image processing occurs in the browser.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Build

```bash
npm run build
```

The production site is generated in `dist/`.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the complete project, including `.github`.
3. In the repository, open **Settings → Pages**.
4. Set the source to **GitHub Actions**.
5. Push to `main` and wait for the deployment workflow.

`vite.config.ts` uses relative asset paths, so the site can run from a GitHub project subdirectory.

## Privacy

BgFyer does not include analytics, a backend, advertising, or remote image processing. The chosen file stays in the browser tab. The AI model itself is downloaded from Hugging Face on first use.

## Main files

- `src/main.ts` — upload, model inference, preview, and export logic
- `src/styles.css` — the full visual system
- `public/favicon.svg` — favicon and compact brand mark
- `vite.config.ts` — build configuration

## Changing the model

The current model is configured near the top of `src/main.ts`:

```ts
const MODEL_ID = 'Xenova/modnet';
```

A future general-object edition can use a compatible Transformers.js background-removal model, but model size, browser memory usage, quality, and licensing should be checked before changing it.
