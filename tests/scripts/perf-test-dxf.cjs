/**
 * DXF 파싱 성능 테스트 스크립트
 * dxf-parser 라이브러리의 파싱 성능 측정
 */

const fs = require('fs');
const path = require('path');

// dxf-parser는 ESM이므로 dynamic import 사용
async function runTests() {
  const { default: DxfParser } = await import('dxf-parser');

  const testDir = path.join(__dirname, '..', 'fixtures', 'dxf');
  const testFiles = [
    'test-1k.dxf',
    'test-10k.dxf',
    'test-50k.dxf',
    'test-100k.dxf',
  ];

  console.log('=== DXF Parser Performance Test ===\n');
  console.log('Environment: Node.js', process.version);
  console.log('');

  const results = [];

  for (const filename of testFiles) {
    const filepath = path.join(testDir, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`[SKIP] ${filename} not found`);
      continue;
    }

    const fileSize = fs.statSync(filepath).size;
    const content = fs.readFileSync(filepath, 'utf8');

    // 파싱 테스트 (3회 실행 후 평균)
    const runs = 3;
    const parseTimes = [];
    let entityCount = 0;

    for (let i = 0; i < runs; i++) {
      const parser = new DxfParser();

      const startParse = performance.now();
      const dxf = parser.parseSync(content);
      const endParse = performance.now();

      parseTimes.push(endParse - startParse);
      entityCount = dxf.entities?.length ?? 0;
    }

    const avgParseTime = parseTimes.reduce((a, b) => a + b, 0) / runs;

    const result = {
      file: filename,
      fileSize: (fileSize / 1024).toFixed(1),
      entities: entityCount,
      parseTime: avgParseTime.toFixed(1),
      entitiesPerSec: Math.round(entityCount / (avgParseTime / 1000)),
    };

    results.push(result);

    console.log(`[${filename}]`);
    console.log(`  File size: ${result.fileSize} KB`);
    console.log(`  Entities: ${result.entities.toLocaleString()}`);
    console.log(`  Parse time: ${result.parseTime} ms (avg of ${runs} runs)`);
    console.log(`  Throughput: ${result.entitiesPerSec.toLocaleString()} entities/sec`);
    console.log('');
  }

  // 결과 요약 테이블
  console.log('=== Summary Table ===');
  console.log('| File | Size | Entities | Parse Time | Throughput |');
  console.log('|------|------|----------|------------|------------|');
  for (const r of results) {
    console.log(`| ${r.file} | ${r.fileSize} KB | ${r.entities.toLocaleString()} | ${r.parseTime} ms | ${r.entitiesPerSec.toLocaleString()}/s |`);
  }

  // 권장 사항
  console.log('\n=== Recommendations ===');
  const slowest = results[results.length - 1];
  if (slowest && parseFloat(slowest.parseTime) < 1000) {
    console.log(`✅ 100K entities parsed in ${slowest.parseTime}ms - Good performance!`);
    console.log(`   Recommended max file size: ~10MB (200K entities)`);
  } else if (slowest && parseFloat(slowest.parseTime) < 3000) {
    console.log(`⚠️ 100K entities parsed in ${slowest.parseTime}ms - Acceptable`);
    console.log(`   Recommended max file size: ~5MB (100K entities)`);
  } else {
    console.log(`❌ Performance may be slow for large files`);
    console.log(`   Consider using WebWorker for files > 1MB`);
  }

  return results;
}

runTests().catch(console.error);
