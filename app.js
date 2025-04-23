// app.js - 全テキスト抽出ツール（抽出順序精度改善版）

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

const fileInput = document.getElementById('pdf-upload');
const outputArea = document.getElementById('output');

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let allText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // 位置情報でソート（上から下、左から右）
    textContent.items.sort((a, b) => {
      const ay = a.transform[5];
      const by = b.transform[5];
      if (Math.abs(ay - by) < 5) {
        return a.transform[4] - b.transform[4];
      } else {
        return by - ay;
      }
    });

    const pageText = textContent.items.map(item => item.str).join('');
    allText += `\n--- Page ${pageNum} ---\n` + pageText + '\n';
  }

  outputArea.textContent = allText;
});
