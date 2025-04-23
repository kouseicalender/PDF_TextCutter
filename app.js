// ワーカーをCDNで設定
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

console.log('✅ app.js loaded');

document.getElementById('pdf-upload').addEventListener('change', async (e) => {
  console.log('📤 PDFアップロード開始');

  const file = e.target.files[0];
  if (!file) {
    console.log('⚠️ ファイルが選択されていません');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    console.log('📖 PDF読み込み中…');

    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    console.log(`📄 PDFページ数: ${pdf.numPages}`);

    const output = document.getElementById('output');
    output.innerHTML = ''; // 初期化

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const lines = content.items.map(item => item.str.trim()).filter(t => t.length > 0);

      const pageBlock = document.createElement('div');
      const header = document.createElement('h3');
      header.textContent = `📄 Page ${i}`;
      const pre = document.createElement('pre');
      pre.textContent = lines.join('\n');

      pageBlock.appendChild(header);
      pageBlock.appendChild(pre);
      output.appendChild(pageBlock);

      console.log(`✅ Page ${i} 行数: ${lines.length}`);
    }
  };
  reader.readAsArrayBuffer(file);
});
