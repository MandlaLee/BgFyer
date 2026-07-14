(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))l(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&l(i)}).observe(document,{childList:!0,subtree:!0});function r(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function l(s){if(s.ep)return;s.ep=!0;const a=r(s);fetch(s.href,a)}})();const J="modulepreload",H=function(e,o){return new URL(e,o).href},$={},X=function(o,r,l){let s=Promise.resolve();if(r&&r.length>0){let x=function(c){return Promise.all(c.map(u=>Promise.resolve(u).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};const i=document.getElementsByTagName("link"),d=document.querySelector("meta[property=csp-nonce]"),L=d?.nonce||d?.getAttribute("nonce");s=x(r.map(c=>{if(c=H(c,l),c in $)return;$[c]=!0;const u=c.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(l)for(let v=i.length-1;v>=0;v--){const E=i[v];if(E.href===c&&(!u||E.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${f}`))return;const p=document.createElement("link");if(p.rel=u?"stylesheet":J,u||(p.as="script"),p.crossOrigin="",p.href=c,L&&p.setAttribute("nonce",L),document.head.appendChild(p),u)return new Promise((v,E)=>{p.addEventListener("load",v),p.addEventListener("error",()=>E(new Error(`Unable to preload CSS for ${c}`)))})}))}function a(i){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=i,window.dispatchEvent(d),!d.defaultPrevented)throw i}return s.then(i=>{for(const d of i||[])d.status==="rejected"&&a(d.reason);return o().catch(a)})},Q="Xenova/modnet",Z=20*1024*1024,ee=new Set(["image/jpeg","image/png","image/webp"]),t={file:null,originalUrl:null,resultUrl:null,resultBlob:null,processing:!1,error:"",background:"transparent",customColor:"#ececec",format:"png",view:"result"};let k=null;const N=document.querySelector("#app");if(!N)throw new Error("App container not found.");N.innerHTML=`
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
`;const b=n("fileInput"),te=n("heroUpload"),oe=n("jumpToTool"),m=n("dropzone"),B=n("stage"),h=n("previewImage"),D=n("processing"),_=n("processingTitle"),V=n("processingCopy"),z=n("fileMeta"),T=n("modelStatus"),re=n("statusDot"),w=n("removeButton"),g=n("downloadButton"),j=n("resetButton"),S=n("replaceImage"),y=n("resultView"),C=n("originalView"),A=n("format"),W=n("filename"),F=n("customColor"),G=n("backgroundButtons"),q=n("errorMessage");te.addEventListener("click",()=>b.click());oe.addEventListener("click",()=>document.querySelector("#remover")?.scrollIntoView({behavior:"smooth"}));S.addEventListener("click",()=>b.click());b.addEventListener("change",()=>{const e=b.files?.[0];e&&I(e)});m.addEventListener("dragover",e=>{e.preventDefault(),m.classList.add("dragging")});m.addEventListener("dragleave",()=>m.classList.remove("dragging"));m.addEventListener("drop",e=>{e.preventDefault(),m.classList.remove("dragging");const o=e.dataTransfer?.files[0];o&&I(o)});document.addEventListener("paste",e=>{const r=[...e.clipboardData?.items??[]].find(l=>l.type.startsWith("image/"))?.getAsFile();r&&I(r)});w.addEventListener("click",()=>{ne()});g.addEventListener("click",()=>{ae()});j.addEventListener("click",le);y.addEventListener("click",()=>Y("result"));C.addEventListener("click",()=>Y("original"));A.addEventListener("change",()=>{t.format=A.value,t.format==="jpeg"&&t.background==="transparent"&&R("white")});F.addEventListener("input",()=>{t.customColor=F.value,R("custom")});G.addEventListener("click",e=>{const r=e.target.dataset.bg;r&&R(r)});async function I(e){if(P(),!ee.has(e.type))return U("Choose a JPEG, PNG or WebP image.");if(e.size>Z)return U("This image is larger than 20 MB. Choose a smaller file.");M(),t.file=e,t.originalUrl=URL.createObjectURL(e),t.resultUrl=null,t.resultBlob=null,t.view="original",h.src=t.originalUrl,h.hidden=!1,m.hidden=!0,z.textContent=`${e.name} · ${ce(e.size)}`,W.value=`${de(e.name)}-bg-removed`,w.disabled=!1,j.disabled=!1,S.disabled=!1,C.disabled=!1,y.disabled=!0,g.disabled=!0,O()}async function se(){if(k)return k;T.textContent="Loading model…",_.textContent="Loading removal model…",V.textContent="The first load downloads the model to your browser cache. Your image is not uploaded.";const e=await X(()=>import("./transformers.web-BdW3SXSs.js"),[],import.meta.url);return e.env.allowLocalModels=!1,k=await e.pipeline("background-removal",Q,{dtype:"fp32"}),T.textContent="Model ready",re.classList.add("ready"),k}async function ne(){if(!(!t.file||t.processing)){P(),t.processing=!0,D.hidden=!1,w.disabled=!0;try{const e=await se();_.textContent="Removing background…",V.textContent="BgFyer is creating the foreground mask locally on your device.";const o=await e(t.originalUrl),r=Array.isArray(o)?o[0]:o;if(!r||typeof r.toBlob!="function")throw new Error("The model did not return a usable image.");const l=await r.toBlob("image/png");if(!(l instanceof Blob))throw new Error("Could not create the transparent result.");t.resultUrl&&URL.revokeObjectURL(t.resultUrl),t.resultBlob=l,t.resultUrl=URL.createObjectURL(l),t.view="result",K(),y.disabled=!1,g.disabled=!1,O()}catch(e){console.error(e),U(e instanceof Error?`BgFyer could not process this image: ${e.message}`:"BgFyer could not process this image."),T.textContent="Model unavailable"}finally{t.processing=!1,D.hidden=!0,w.disabled=!1}}}async function ae(){if(t.resultBlob){P(),g.disabled=!0,g.textContent="Preparing…";try{const e=await ie(t.resultBlob,t.format,t.background,t.customColor),o=t.format==="jpeg"?"jpg":t.format,r=document.createElement("a");r.href=URL.createObjectURL(e),r.download=`${ue(W.value||"bgfyer-cutout")}.${o}`,document.body.append(r),r.click(),r.remove(),setTimeout(()=>URL.revokeObjectURL(r.href),1e3)}catch(e){console.error(e),U("The image could not be exported. Try PNG instead.")}finally{g.disabled=!1,g.textContent="Download image"}}}async function ie(e,o,r,l){const s=await createImageBitmap(e),a=document.createElement("canvas");a.width=s.width,a.height=s.height;const i=a.getContext("2d");if(!i)throw new Error("Canvas is unavailable.");const d=r==="transparent"?null:r==="white"?"#ffffff":r==="black"?"#111111":l;(o==="jpeg"||d)&&(i.fillStyle=d??"#ffffff",i.fillRect(0,0,a.width,a.height)),i.drawImage(s,0,0),s.close();const L=o==="jpeg"?"image/jpeg":o==="webp"?"image/webp":"image/png";return new Promise((x,c)=>a.toBlob(u=>u?x(u):c(new Error("Encoding failed.")),L,.92))}function R(e){t.background=e,B.classList.remove("white","black","custom"),e!=="transparent"&&B.classList.add(e),e==="custom"?B.style.backgroundColor=t.customColor:B.style.removeProperty("background-color"),G.querySelectorAll("button").forEach(o=>{o.classList.toggle("active",o.dataset.bg===e)}),t.format==="jpeg"&&e==="transparent"&&(t.background="white",R("white"))}function Y(e){e==="result"&&!t.resultUrl||(t.view=e,K(),O())}function K(){h.src=t.view==="result"?t.resultUrl??t.originalUrl??"":t.originalUrl??""}function O(){y.classList.toggle("active",t.view==="result"),C.classList.toggle("active",t.view==="original")}function le(){M(),t.file=null,t.originalUrl=null,t.resultUrl=null,t.resultBlob=null,t.view="result",b.value="",h.hidden=!0,h.removeAttribute("src"),m.hidden=!1,z.textContent="No image selected",w.disabled=!0,g.disabled=!0,j.disabled=!0,S.disabled=!0,y.disabled=!0,C.disabled=!0,P()}function M(){t.originalUrl&&URL.revokeObjectURL(t.originalUrl),t.resultUrl&&URL.revokeObjectURL(t.resultUrl)}function n(e){const o=document.getElementById(e);if(!o)throw new Error(`Missing element: ${e}`);return o}function U(e){t.error=e,q.textContent=e}function P(){t.error="",q.textContent=""}function ce(e){return e<1024*1024?`${Math.round(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}function de(e){return e.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"image"}function ue(e){return e.trim().toLowerCase().replace(/[^a-z0-9-_]+/g,"-").replace(/^-+|-+$/g,"")||"bgfyer-cutout"}window.addEventListener("beforeunload",M);
//# sourceMappingURL=index-BRX9ok2M.js.map
