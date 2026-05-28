import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import XLSX from 'xlsx';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const TEXT_EXTS = new Set(['.txt', '.md', '.csv', '.json', '.log', '.text']);
const EXCEL_EXTS = new Set(['.xlsx', '.xls']);

function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTS.has(ext)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (EXCEL_EXTS.has(ext)) {
    const wb = XLSX.readFile(filePath);
    let text = '';
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      text += `[시트: ${sheetName}]\n`;
      text += XLSX.utils.sheet_to_csv(ws) + '\n\n';
    }
    return text;
  }
  return null;
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

// GET /api/knowledge/list?dir=...
app.get('/api/knowledge/list', (req, res) => {
  const dir = req.query.dir;
  if (!dir) return res.status(400).json({ error: '경로를 입력하세요.' });
  try {
    const normalDir = path.resolve(dir);
    const entries = fs.readdirSync(normalDir, { withFileTypes: true });
    const files = entries
      .filter(e => e.isFile())
      .map(e => {
        const ext = path.extname(e.name).toLowerCase();
        const supported = TEXT_EXTS.has(ext) || EXCEL_EXTS.has(ext);
        const stat = fs.statSync(path.join(normalDir, e.name));
        return { name: e.name, ext, supported, size: formatSize(stat.size) };
      });
    res.json({ dir: normalDir, files });
  } catch (err) {
    res.status(500).json({ error: `경로를 읽을 수 없습니다: ${err.message}` });
  }
});

// POST /api/knowledge/ask
// body: { dir, question, apiKey, history }
app.post('/api/knowledge/ask', async (req, res) => {
  const { dir, question, apiKey, history = [] } = req.body;
  if (!dir || !question || !apiKey) {
    return res.status(400).json({ error: '필수 파라미터(dir, question, apiKey)가 없습니다.' });
  }

  const normalDir = path.resolve(dir);

  // 모든 지원 파일 읽기
  let documents = '';
  try {
    const entries = fs.readdirSync(normalDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(normalDir, entry.name);
      try {
        const text = extractText(filePath);
        if (text) {
          documents += `\n=== 문서: ${entry.name} ===\n${text.trim()}\n`;
        }
      } catch {
        // 개별 파일 읽기 실패 시 건너뜀
      }
    }
  } catch (err) {
    return res.status(500).json({ error: `문서 폴더를 읽을 수 없습니다: ${err.message}` });
  }

  if (!documents.trim()) {
    return res.status(400).json({ error: '지정된 폴더에 읽을 수 있는 문서(txt, md, csv, xlsx)가 없습니다.' });
  }

  const systemPrompt = `당신은 프로젝트 PMO 어시스턴트입니다. 아래 프로젝트 문서를 기반으로 질문에 정확하게 답해주세요.
문서에 없는 내용은 "해당 정보를 문서에서 찾을 수 없습니다"라고 솔직하게 답해주세요.
답변은 간결하고 명확하게 한국어로 작성하고, 관련 문서명을 언급해주세요.

[프로젝트 문서]
${documents}`;

  const messages = [
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: `Claude API 오류: ${errData.error?.message || response.statusText}`,
      });
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text || '응답을 받지 못했습니다.';
    res.json({ answer, docsUsed: documents.split('=== 문서:').length - 1 });
  } catch (err) {
    res.status(500).json({ error: `API 호출 오류: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`\n파일 서버 실행 중: http://localhost:${PORT}`);
  console.log(`API 엔드포인트:`);
  console.log(`  GET  /api/docs/files?dir=C:\\project\\test\\doc`);
  console.log(`  GET  /api/docs/content?dir=C:\\project\\test\\doc&file=filename.xlsx`);
  console.log(`  GET  /api/knowledge/list?dir=C:\\project\\test\\doc`);
  console.log(`  POST /api/knowledge/ask  { dir, question, apiKey }\n`);
});
