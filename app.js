// app.js - 最終クリア版（本文制限緩和・花言葉以外抽出）

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

    // ソート（Y優先 → X）
    items.sort((a, b) => {
      const ay = a.transform[5];
      const by = b.transform[5];
      if (Math.abs(ay - by) < 5) {
        return a.transform[4] - b.transform[4];
      } else {
        return by - ay;
      }
    });

    // 行単位でまとめる
    let lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(lastY - y) > 5) {
        lines.push(currentLine.map(i => i.str).join('').replace(/[\s　]+/g, ''));
        currentLine = [];
      }
      currentLine.push(item);
      lastY = y;
    }
    if (currentLine.length) {
      lines.push(currentLine.map(i => i.str).join('').replace(/[\s　]+/g, ''));
    }

    // 花言葉抽出
    const flowerIdx = lines.findIndex(line => line.includes('花言葉'));
    let flowerWord = '';
    if (flowerIdx !== -1) {
      for (let i = flowerIdx + 1; i <= flowerIdx + 2 && i < lines.length; i++) {
        if (lines[i].length <= 30) {
          flowerWord = lines[i].trim();
          break;
        }
      }
    }

    // 本文抽出（花言葉以外の末尾3行）
    const bodyLines = lines
      .slice(0, flowerIdx !== -1 ? flowerIdx : lines.length)
      .filter((line, i) => i !== flowerIdx && i !== flowerIdx + 1);

    const description = bodyLines.slice(-3).join('\n').trim();

    results.push(`${description}\n${flowerWord}\n`);
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
