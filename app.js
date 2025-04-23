// app.js - PDFテキスト分析モード付き抽出ツール v1（分析モード）

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

const fileInput = document.getElementById('pdf-upload');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const textLayer = document.getElementById('text-layer');
const selectedTextList = document.getElementById('selected-text');

let selectedTexts = [];

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1.5 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;

  const textContent = await page.getTextContent();
  textLayer.innerHTML = '';
  textLayer.style.width = canvas.width + 'px';
  textLayer.style.height = canvas.height + 'px';
  textLayer.style.position = 'absolute';
  textLayer.style.top = '0';
  textLayer.style.left = '0';
  textLayer.style.pointerEvents = 'none';

  textContent.items.forEach(item => {
    const tx = pdfjsLib.Util.transform(
      pdfjsLib.Util.transform(viewport.transform, item.transform),
      [1, 0, 0, -1, 0, 0]
    );

    const div = document.createElement('div');
    div.className = 'text-box';
    div.style.left = tx[4] + 'px';
    div.style.top = tx[5] + 'px';
    div.style.width = item.width * viewport.scale + 'px';
    div.style.height = item.height * viewport.scale + 'px';
    div.title = item.str;
    div.textContent = item.str;
    div.style.pointerEvents = 'auto';

    div.addEventListener('click', () => {
      div.classList.toggle('selected');
      if (div.classList.contains('selected')) {
        selectedTexts.push(item.str);
      } else {
        selectedTexts = selectedTexts.filter(t => t !== item.str);
      }
      renderSelectedTexts();
    });

    textLayer.appendChild(div);
  });
});

function renderSelectedTexts() {
  selectedTextList.innerHTML = '';
  selectedTexts.forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    selectedTextList.appendChild(li);
  });
}
