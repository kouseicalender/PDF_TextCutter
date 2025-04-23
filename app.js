// app.js - 構造抽出バージョン（位置＋キーワードで高精度分類）

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

    // 花言葉を探してそれ以降を取得
    const flowerIdx = lines.findIndex(line => line.includes('花言葉'));
    const flowerWord = flowerIdx !== -1 && lines[flowerIdx + 1] ? lines[flowerIdx + 1].trim() : '';

    // 本文らしいもの（長めでキーワード除外）を結合
    const description = lines
      .filter((line, i) =>
        i !== flowerIdx && i !== flowerIdx + 1 &&
        line.length > 20 && !/花言葉|元日|\d{1,2}(THURSDAY|FRIDAY|SATURDAY|SUNDAY|MONDAY|TUESDAY|WEDNESDAY)/.test(line)
      )
      .join('\n').trim();

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
