// app.js - 花言葉抽出ツール（整形維持・段落ベース）

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
    const items = content.items;

    // ソート（Y→X）
    items.sort((a, b) => {
      const ay = a.transform[5];
      const by = b.transform[5];
      if (Math.abs(ay - by) < 5) {
        return a.transform[4] - b.transform[4];
      } else {
        return by - ay;
      }
    });

    // 近い行は改行として扱い、段落として維持
    let lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(lastY - y) > 5) {
        lines.push(currentLine.map(i => i.str).join(''));
        currentLine = [];
      }
      currentLine.push(item);
      lastY = y;
    }
    if (currentLine.length) lines.push(currentLine.map(i => i.str).join(''));

    // 結合して花言葉を検出
    const fullText = lines.join('\n').trim();
    const keywordIndex = lines.findIndex(line => line.includes('花言葉'));

    if (keywordIndex >= 0 && keywordIndex + 1 < lines.length) {
      const description = lines.slice(0, keywordIndex).join('\n').trim();
      const flowerWord = lines[keywordIndex + 1].trim();
      results.push(`${description}\n${flowerWord}\n`);
    } else {
      results.push(`-- 抽出失敗 Page ${pageNum} --\n${fullText}\n`);
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
