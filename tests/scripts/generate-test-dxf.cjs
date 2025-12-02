/**
 * DXF 성능 테스트용 파일 생성 스크립트
 * 다양한 엔티티 수의 DXF 파일 생성
 */

const fs = require('fs');
const path = require('path');

// DXF 파일 헤더
const DXF_HEADER = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
`;

// DXF 파일 푸터
const DXF_FOOTER = `0
ENDSEC
0
EOF
`;

/**
 * LINE 엔티티 생성
 */
function generateLine(x1, y1, x2, y2, layer = '0') {
  return `0
LINE
8
${layer}
10
${x1}
20
${y1}
30
0
11
${x2}
21
${y2}
31
0
`;
}

/**
 * 랜덤 LINE 엔티티 배열 생성
 */
function generateRandomLines(count, maxCoord = 1000) {
  let entities = '';
  for (let i = 0; i < count; i++) {
    const x1 = Math.random() * maxCoord;
    const y1 = Math.random() * maxCoord;
    const x2 = Math.random() * maxCoord;
    const y2 = Math.random() * maxCoord;
    entities += generateLine(x1.toFixed(2), y1.toFixed(2), x2.toFixed(2), y2.toFixed(2));
  }
  return entities;
}

/**
 * DXF 파일 생성
 */
function createDXFFile(lineCount, outputPath) {
  console.log(`Generating ${lineCount.toLocaleString()} LINE entities...`);
  const startTime = Date.now();

  const entities = generateRandomLines(lineCount);
  const dxfContent = DXF_HEADER + entities + DXF_FOOTER;

  fs.writeFileSync(outputPath, dxfContent);

  const fileSize = fs.statSync(outputPath).size;
  const elapsed = Date.now() - startTime;

  console.log(`  Created: ${outputPath}`);
  console.log(`  Size: ${(fileSize / 1024).toFixed(1)} KB`);
  console.log(`  Generation time: ${elapsed} ms`);
  console.log('');

  return { lineCount, fileSize, path: outputPath };
}

// 출력 디렉토리 생성
const outputDir = path.join(__dirname, '..', 'fixtures', 'dxf');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('=== DXF Performance Test Files Generator ===\n');

// 테스트 파일 생성
// FILE_LIMITS.MAX_SIZE_BYTES = 20MB 기준
const testCases = [
  { lines: 1000, name: 'test-1k.dxf' },      // ~60KB
  { lines: 10000, name: 'test-10k.dxf' },    // ~600KB
  { lines: 50000, name: 'test-50k.dxf' },    // ~3MB
  { lines: 100000, name: 'test-100k.dxf' },  // ~6MB
  { lines: 350000, name: 'test-overlimit.dxf' }, // ~21MB (20MB 초과 테스트용)
];

const results = [];

for (const testCase of testCases) {
  const outputPath = path.join(outputDir, testCase.name);
  const result = createDXFFile(testCase.lines, outputPath);
  results.push(result);
}

console.log('=== Summary ===');
console.log('| Lines | File Size | Path |');
console.log('|-------|-----------|------|');
for (const r of results) {
  console.log(`| ${r.lineCount.toLocaleString()} | ${(r.fileSize / 1024).toFixed(1)} KB | ${path.basename(r.path)} |`);
}
console.log('\nDone! Files are in tests/fixtures/dxf/');
