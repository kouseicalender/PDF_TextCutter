// app.js - フォント名で本文と花言葉を判別して抽出

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

const upload = document.getElementById('pdf-upload');
const output = document.getElementById('output');
const exportBtn = document.getElementById('export-btn');

upload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
    cMapPacked: true,
    useWorkerFetch: true
  }).promise;

  let results = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const styles = content.styles;
    const items = content.items;

    // 分類用 fontName（調査結果に基づく）
    const descFont = 'g_d0_f1';     // 本文
    const flowerFont = 'g_d0_f3';   // 花言葉

    const description = items.filter(i => i.fontName === descFont).map(i => i.str).join('').trim();
    const flowerWord = items.filter(i => i.fontName === flowerFont).map(i => i.str).join('').trim();

    if (description || flowerWord) {
      results.push(`${description}\n${flowerWord}\n`);
    } else {
      results.push(`-- 抽出失敗 Page ${pageNum} --`);
    }
  }

  output.textContent = results.join('\n');
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([output.textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '花説明と花言葉.txt';
  a.click();
  URL.revokeObjectURL(url);
});