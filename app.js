// app.js - 花言葉抽出ツール（キーワード正規表現版）

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

    const allText = items.map(i => i.str).join('').replace(/\s+/g, '');

    // 正規表現で「花言葉」直後の短文を花言葉として抽出
    const match = allText.match(/花言葉(.{3,20}?)(?:元日|\d{1,2}[A-Z]{2,}|[A-Z]{3,9})?/);
    const flowerWord = match ? match[1].trim() : '（未抽出）';
    const description = match ? allText.slice(0, match.index).trim() : allText;

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
