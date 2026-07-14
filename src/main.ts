import './styles.css';

type BackgroundMode = 'transparent' | 'white' | 'black' | 'custom';
type ExportFormat = 'png' | 'webp' | 'jpeg';
type ViewMode = 'result' | 'original';

const MODEL_ID = 'Xenova/modnet';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);


type AppState = {
  file: File | null;
  originalUrl: string | null;
  resultUrl: string | null;
  resultBlob: Blob | null;
  processing: boolean;
  error: string;
  background: BackgroundMode;
  customColor: string;
  format: ExportFormat;
  view: ViewMode;
};

const state: AppState = {
  file: null,
  originalUrl: null,
  resultUrl: null,
  resultBlob: null,
  processing: false,
  error: '',
  background: 'transparent',
  customColor: '#ececec',
  format: 'png',
  view: 'result',
};

type BackgroundRemovalResult = { toBlob: (type?: string) => Promise<Blob> };
type BackgroundRemover = (input: string) => Promise<BackgroundRemovalResult[] | BackgroundRemovalResult>;
let remover: BackgroundRemover | null = null;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App container not found.');

app.innerHTML = `
  <main class="shell">
    <header class="header">
      <div class="brand"><span class="brand-mark">BG</span><span>BgFyer</span></div>
      <div class="header-meta"><span>PRIVATE · BROWSER-BASED</span><span><i id="statusDot" class="status-dot"></i><span id="modelStatus">Model loads when needed</span></span></div>
    </header>

    <section class="hero">
      <div>
        <p class="eyebrow">Background remover</p>
        <h1>Keep the subject.<br>Lose the background.</h1>
      </div>
      <div class="hero-copy">
        <p>Remove portrait backgrounds directly in your browser. No account, no upload, no watermark.</p>
        <div class="button-row">
          <button class="btn primary" id="heroUpload">Choose image</button>
          <button class="btn" id="jumpToTool">Open remover</button>
        </div>
        <p class="privacy-line">The model downloads once. Your image stays on your device.</p>
      </div>
    </section>

    <section class="tool-section" id="remover">
      <div class="section-head">
        <h2>Remove a background.</h2>
        <p>Upload a portrait, let BgFyer create a clean cutout, then choose a transparent or solid background and export.</p>
      </div>

      <div class="workspace">
        <section class="preview-panel">
          <div class="preview-bar">
            <span id="fileMeta">No image selected</span>
            <div class="preview-switch">
              <button class="mini-btn active" id="resultView" disabled>Result</button>
              <button class="mini-btn" id="originalView" disabled>Original</button>
              <button class="mini-btn" id="replaceImage" disabled>Replace</button>
            </div>
          </div>
          <div class="stage" id="stage">
            <label class="dropzone" id="dropzone">
              <input id="fileInput" type="file" accept="image/jpeg,image/png,image/webp" />
              <div>
                <p class="eyebrow">JPEG · PNG · WEBP</p>
                <strong>Drop an image here.</strong>
                <p>Or click to browse. You can also paste an image from your clipboard.</p>
                <span class="btn primary">Choose image</span>
              </div>
            </label>
            <img id="previewImage" alt="Background removal preview" hidden />
            <div class="processing" id="processing" hidden>
              <div class="processing-card">
                <p class="eyebrow">Working locally</p>
                <h3 id="processingTitle">Preparing image…</h3>
                <p class="details" id="processingCopy">The first use downloads the background-removal model. This can take a moment.</p>
                <div class="progress-track"><div class="progress-bar"></div></div>
                <p class="details">Keep this tab open until the cutout is ready.</p>
              </div>
            </div>
          </div>
        </section>

        <aside class="controls">
          <div class="control-block">
            <h3>Background</h3>
            <div class="segmented" id="backgroundButtons">
              <button class="active" data-bg="transparent">Clear</button>
              <button data-bg="white">White</button>
              <button data-bg="black">Black</button>
            </div>
            <div class="field">
              <label for="customColor">Custom colour</label>
              <input type="color" id="customColor" value="#ececec" />
            </div>
          </div>

          <div class="control-block">
            <h3>Export</h3>
            <div class="field">
              <label for="format">Format</label>
              <select id="format">
                <option value="png">PNG — transparent</option>
                <option value="webp">WebP — smaller</option>
                <option value="jpeg">JPEG — solid background</option>
              </select>
            </div>
            <div class="field">
              <label for="filename">Filename</label>
              <input id="filename" type="text" value="bgfyer-cutout" spellcheck="false" />
            </div>
          </div>

          <div class="control-block">
            <button class="btn primary full" id="removeButton" disabled>Remove background</button>
            <button class="btn full" id="downloadButton" disabled style="margin-top:8px">Download image</button>
            <button class="btn full" id="resetButton" disabled style="margin-top:8px">Start over</button>
            <p id="errorMessage" class="error" role="alert"></p>
          </div>

          <div class="control-block">
            <h3>Privacy</h3>
            <p class="details">Your image is decoded, processed and exported inside this browser tab. BgFyer does not send it to a server.</p>
          </div>
        </aside>
      </div>

      <div class="after-tool">
        <div class="fact"><span>01 · Private</span><strong>Images stay on your device.</strong></div>
        <div class="fact"><span>02 · Simple</span><strong>Upload. Remove. Download.</strong></div>
        <div class="fact"><span>03 · Honest</span><strong>Best results on people and portraits.</strong></div>
      </div>
    </section>

    <footer class="footer"><span>BgFyer — backgrounds out, privacy intact.</span><span>Built for the Fyer ecosystem.</span></footer>
  </main>
`;

const fileInput = get<HTMLInputElement>('fileInput');
const heroUpload = get<HTMLButtonElement>('heroUpload');
const jumpToTool = get<HTMLButtonElement>('jumpToTool');
const dropzone = get<HTMLLabelElement>('dropzone');
const stage = get<HTMLDivElement>('stage');
const previewImage = get<HTMLImageElement>('previewImage');
const processing = get<HTMLDivElement>('processing');
const processingTitle = get<HTMLHeadingElement>('processingTitle');
const processingCopy = get<HTMLParagraphElement>('processingCopy');
const fileMeta = get<HTMLSpanElement>('fileMeta');
const modelStatus = get<HTMLSpanElement>('modelStatus');
const statusDot = get<HTMLElement>('statusDot');
const removeButton = get<HTMLButtonElement>('removeButton');
const downloadButton = get<HTMLButtonElement>('downloadButton');
const resetButton = get<HTMLButtonElement>('resetButton');
const replaceImage = get<HTMLButtonElement>('replaceImage');
const resultView = get<HTMLButtonElement>('resultView');
const originalView = get<HTMLButtonElement>('originalView');
const format = get<HTMLSelectElement>('format');
const filename = get<HTMLInputElement>('filename');
const customColor = get<HTMLInputElement>('customColor');
const backgroundButtons = get<HTMLDivElement>('backgroundButtons');
const errorMessage = get<HTMLParagraphElement>('errorMessage');

heroUpload.addEventListener('click', () => fileInput.click());
jumpToTool.addEventListener('click', () => document.querySelector('#remover')?.scrollIntoView({ behavior: 'smooth' }));
replaceImage.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void selectFile(file);
});

dropzone.addEventListener('dragover', (event) => { event.preventDefault(); dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragging');
  const file = event.dataTransfer?.files[0];
  if (file) void selectFile(file);
});

document.addEventListener('paste', (event) => {
  const imageItem = [...event.clipboardData?.items ?? []].find((item) => item.type.startsWith('image/'));
  const file = imageItem?.getAsFile();
  if (file) void selectFile(file);
});

removeButton.addEventListener('click', () => void removeBackground());
downloadButton.addEventListener('click', () => void downloadResult());
resetButton.addEventListener('click', reset);
resultView.addEventListener('click', () => setView('result'));
originalView.addEventListener('click', () => setView('original'));
format.addEventListener('change', () => {
  state.format = format.value as ExportFormat;
  if (state.format === 'jpeg' && state.background === 'transparent') setBackground('white');
});
customColor.addEventListener('input', () => {
  state.customColor = customColor.value;
  setBackground('custom');
});
backgroundButtons.addEventListener('click', (event) => {
  const target = event.target as HTMLButtonElement;
  const selected = target.dataset.bg as BackgroundMode | undefined;
  if (selected) setBackground(selected);
});

async function selectFile(file: File): Promise<void> {
  clearError();
  if (!ALLOWED_TYPES.has(file.type)) return setError('Choose a JPEG, PNG or WebP image.');
  if (file.size > MAX_FILE_BYTES) return setError('This image is larger than 20 MB. Choose a smaller file.');

  releaseUrls();
  state.file = file;
  state.originalUrl = URL.createObjectURL(file);
  state.resultUrl = null;
  state.resultBlob = null;
  state.view = 'original';

  previewImage.src = state.originalUrl;
  previewImage.hidden = false;
  dropzone.hidden = true;
  fileMeta.textContent = `${file.name} · ${formatBytes(file.size)}`;
  filename.value = `${safeBaseName(file.name)}-bg-removed`;
  removeButton.disabled = false;
  resetButton.disabled = false;
  replaceImage.disabled = false;
  originalView.disabled = false;
  resultView.disabled = true;
  downloadButton.disabled = true;
  updateViewButtons();
}

async function getRemover(): Promise<BackgroundRemover> {
  if (remover) return remover;
  modelStatus.textContent = 'Loading model…';
  processingTitle.textContent = 'Loading removal model…';
  processingCopy.textContent = 'The first load downloads the model to your browser cache. Your image is not uploaded.';
  const transformers = await import('@huggingface/transformers');
  transformers.env.allowLocalModels = false;
  remover = await transformers.pipeline('background-removal', MODEL_ID, { dtype: 'fp32' }) as unknown as BackgroundRemover;
  modelStatus.textContent = 'Model ready';
  statusDot.classList.add('ready');
  return remover;
}

async function removeBackground(): Promise<void> {
  if (!state.file || state.processing) return;
  clearError();
  state.processing = true;
  processing.hidden = false;
  removeButton.disabled = true;

  try {
    const segmenter = await getRemover();
    processingTitle.textContent = 'Removing background…';
    processingCopy.textContent = 'BgFyer is creating the foreground mask locally on your device.';

    const output = await segmenter(state.originalUrl as string);
    const item = Array.isArray(output) ? output[0] : output;
    if (!item || typeof item.toBlob !== 'function') throw new Error('The model did not return a usable image.');

    const blob = await item.toBlob('image/png');
    if (!(blob instanceof Blob)) throw new Error('Could not create the transparent result.');

    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    state.resultBlob = blob;
    state.resultUrl = URL.createObjectURL(blob);
    state.view = 'result';
    setPreviewSource();
    resultView.disabled = false;
    downloadButton.disabled = false;
    updateViewButtons();
  } catch (error) {
    console.error(error);
    setError(error instanceof Error ? `BgFyer could not process this image: ${error.message}` : 'BgFyer could not process this image.');
    modelStatus.textContent = 'Model unavailable';
  } finally {
    state.processing = false;
    processing.hidden = true;
    removeButton.disabled = false;
  }
}

async function downloadResult(): Promise<void> {
  if (!state.resultBlob) return;
  clearError();
  downloadButton.disabled = true;
  downloadButton.textContent = 'Preparing…';
  try {
    const exported = await compositeResult(state.resultBlob, state.format, state.background, state.customColor);
    const extension = state.format === 'jpeg' ? 'jpg' : state.format;
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(exported);
    anchor.download = `${sanitizeFilename(filename.value || 'bgfyer-cutout')}.${extension}`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  } catch (error) {
    console.error(error);
    setError('The image could not be exported. Try PNG instead.');
  } finally {
    downloadButton.disabled = false;
    downloadButton.textContent = 'Download image';
  }
}

async function compositeResult(blob: Blob, outputFormat: ExportFormat, background: BackgroundMode, color: string): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');

  const fill = background === 'transparent' ? null : background === 'white' ? '#ffffff' : background === 'black' ? '#111111' : color;
  if (outputFormat === 'jpeg' || fill) {
    context.fillStyle = fill ?? '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const mime = outputFormat === 'jpeg' ? 'image/jpeg' : outputFormat === 'webp' ? 'image/webp' : 'image/png';
  return new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Encoding failed.')), mime, .92));
}

function setBackground(background: BackgroundMode): void {
  state.background = background;
  stage.classList.remove('white', 'black', 'custom');
  if (background !== 'transparent') stage.classList.add(background);
  if (background === 'custom') stage.style.backgroundColor = state.customColor;
  else stage.style.removeProperty('background-color');

  backgroundButtons.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', (button as HTMLButtonElement).dataset.bg === background);
  });

  if (state.format === 'jpeg' && background === 'transparent') {
    state.background = 'white';
    setBackground('white');
  }
}

function setView(view: ViewMode): void {
  if (view === 'result' && !state.resultUrl) return;
  state.view = view;
  setPreviewSource();
  updateViewButtons();
}

function setPreviewSource(): void {
  previewImage.src = state.view === 'result' ? state.resultUrl ?? state.originalUrl ?? '' : state.originalUrl ?? '';
}

function updateViewButtons(): void {
  resultView.classList.toggle('active', state.view === 'result');
  originalView.classList.toggle('active', state.view === 'original');
}

function reset(): void {
  releaseUrls();
  state.file = null;
  state.originalUrl = null;
  state.resultUrl = null;
  state.resultBlob = null;
  state.view = 'result';
  fileInput.value = '';
  previewImage.hidden = true;
  previewImage.removeAttribute('src');
  dropzone.hidden = false;
  fileMeta.textContent = 'No image selected';
  removeButton.disabled = true;
  downloadButton.disabled = true;
  resetButton.disabled = true;
  replaceImage.disabled = true;
  resultView.disabled = true;
  originalView.disabled = true;
  clearError();
}

function releaseUrls(): void {
  if (state.originalUrl) URL.revokeObjectURL(state.originalUrl);
  if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
}

function get<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element as T;
}

function setError(message: string): void { state.error = message; errorMessage.textContent = message; }
function clearError(): void { state.error = ''; errorMessage.textContent = ''; }
function formatBytes(bytes: number): string { return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function safeBaseName(name: string): string { return name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image'; }
function sanitizeFilename(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'bgfyer-cutout'; }

window.addEventListener('beforeunload', releaseUrls);
