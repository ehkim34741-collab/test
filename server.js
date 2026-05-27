import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// GET /api/docs/files?dir=C:\project\test\doc
app.get('/api/docs/files', (req, res) => {
  const dir = req.query.dir;
  if (!dir) return res.status(400).json({ error: '경로를 입력하세요.' });
  try {
    const normalDir = path.resolve(dir);
    const entries = fs.readdirSync(normalDir, { withFileTypes: true });
    const files = entries
      .filter(e => e.isFile())
      .map(e => {
        const stat = fs.statSync(path.join(normalDir, e.name));
        return { name: e.name, size: formatSize(stat.size), modifiedAt: stat.mtime.toISOString() };
      });
    res.json({ dir: normalDir, files });
  } catch (err) {
    res.status(500).json({ error: `경로를 읽을 수 없습니다: ${err.message}` });
  }
});

// GET /api/docs/content?dir=C:\project\test\doc&file=filename.xlsx
app.get('/api/docs/content', (req, res) => {
  const { dir, file } = req.query;
  if (!dir || !file) return res.status(400).json({ error: '필수 파라미터가 없습니다.' });

  const normalDir = path.resolve(dir);
  const filePath = path.resolve(normalDir, file);

  // 경로 탈출 방지
  if (!filePath.startsWith(normalDir + path.sep) && filePath !== normalDir) {
    return res.status(403).json({ error: '접근이 거부되었습니다.' });
  }

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const mimeMap = {
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.csv': 'text/csv',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.hwp': 'application/x-hwp',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';
    const base64 = content.toString('base64');
    res.json({ name: file, mime, dataUrl: `data:${mime};base64,${base64}` });
  } catch (err) {
    res.status(500).json({ error: `파일을 읽을 수 없습니다: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`\n파일 서버 실행 중: http://localhost:${PORT}`);
  console.log(`API 엔드포인트:`);
  console.log(`  GET /api/docs/files?dir=C:\\project\\test\\doc`);
  console.log(`  GET /api/docs/content?dir=C:\\project\\test\\doc&file=filename.xlsx\n`);
});
