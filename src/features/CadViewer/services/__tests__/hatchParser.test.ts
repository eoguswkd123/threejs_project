/**
 * hatchParser.ts 단위 테스트
 * Raw DXF 텍스트에서 HATCH 엔티티를 추출하는 커스텀 파서 테스트
 */

import { describe, it, expect } from 'vitest';

import { parseHatchesFromDxf } from '../hatchParser';

describe('hatchParser', () => {
    describe('parseHatchesFromDxf', () => {
        it('빈 DXF 콘텐츠에서 빈 배열 반환', () => {
            const result = parseHatchesFromDxf('');
            expect(result).toEqual([]);
        });

        it('HATCH 엔티티가 없는 DXF에서 빈 배열 반환', () => {
            const dxf = `0
LINE
8
Layer1
10
0.0
20
0.0
11
100.0
21
100.0`;
            const result = parseHatchesFromDxf(dxf);
            expect(result).toEqual([]);
        });

        it('단일 SOLID HATCH 파싱', () => {
            const dxf = `0
HATCH
8
Layer1
2
SOLID
92
7
93
4
10
0.0
20
0.0
10
100.0
20
0.0
10
100.0
20
100.0
10
0.0
20
100.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.patternName).toBe('SOLID');
            expect(result[0]!.isSolid).toBe(true);
            expect(result[0]!.layer).toBe('Layer1');
            expect(result[0]!.boundaries).toHaveLength(1);
            expect(result[0]!.boundaries[0]!.type).toBe('polyline');
            const boundary = result[0]!.boundaries[0]!;
            if (boundary.type === 'polyline') {
                expect(boundary.vertices).toHaveLength(4);
            }
        });

        it('패턴 HATCH 파싱 (ANSI31)', () => {
            const dxf = `0
HATCH
8
Layer1
2
ANSI31
41
1.5
52
45.0
92
7
93
3
10
0.0
20
0.0
10
50.0
20
0.0
10
25.0
20
43.3`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.patternName).toBe('ANSI31');
            expect(result[0]!.isSolid).toBe(false);
            expect(result[0]!.patternScale).toBe(1.5);
            expect(result[0]!.patternAngle).toBe(45.0);
        });

        it('색상 인덱스 파싱', () => {
            const dxf = `0
HATCH
8
Layer1
2
SOLID
62
5
92
7
93
3
10
0.0
20
0.0
10
10.0
20
0.0
10
5.0
20
10.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.color).toBe(5);
        });

        it('복수 HATCH 엔티티 파싱', () => {
            const dxf = `0
HATCH
8
Layer1
2
SOLID
92
7
93
3
10
0.0
20
0.0
10
10.0
20
0.0
10
5.0
20
10.0
0
HATCH
8
Layer2
2
ANSI31
92
7
93
3
10
20.0
20
20.0
10
30.0
20
20.0
10
25.0
20
30.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(2);
            expect(result[0]!.layer).toBe('Layer1');
            expect(result[0]!.patternName).toBe('SOLID');
            expect(result[1]!.layer).toBe('Layer2');
            expect(result[1]!.patternName).toBe('ANSI31');
        });

        it('정점이 3개 미만인 경계는 무시', () => {
            const dxf = `0
HATCH
8
Layer1
2
SOLID
92
7
93
2
10
0.0
20
0.0
10
10.0
20
0.0`;
            const result = parseHatchesFromDxf(dxf);
            expect(result).toEqual([]);
        });

        it('닫힘 플래그 파싱 (closed=false)', () => {
            const dxf = `0
HATCH
8
Layer1
2
SOLID
73
0
92
7
93
3
10
0.0
20
0.0
10
10.0
20
0.0
10
5.0
20
10.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.boundaries[0]!.type).toBe('polyline');
            const boundary246 = result[0]!.boundaries[0]!;
            if (boundary246.type === 'polyline') {
                expect(boundary246.closed).toBe(false);
            }
        });

        it('닫힘 플래그 파싱 (closed=true)', () => {
            const dxf = `0
HATCH
8
Layer1
2
SOLID
73
1
92
7
93
3
10
0.0
20
0.0
10
10.0
20
0.0
10
5.0
20
10.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.boundaries[0]!.type).toBe('polyline');
            const boundary280 = result[0]!.boundaries[0]!;
            if (boundary280.type === 'polyline') {
                expect(boundary280.closed).toBe(true);
            }
        });

        it('레이어가 없는 HATCH 파싱', () => {
            const dxf = `0
HATCH
2
SOLID
92
7
93
3
10
0.0
20
0.0
10
10.0
20
0.0
10
5.0
20
10.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.layer).toBeUndefined();
        });

        it('기본값 검증 (patternScale, patternAngle)', () => {
            const dxf = `0
HATCH
8
Layer1
2
DOTS
92
7
93
3
10
0.0
20
0.0
10
10.0
20
0.0
10
5.0
20
10.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.patternScale).toBe(1);
            expect(result[0]!.patternAngle).toBe(0);
        });

        it('solid 대소문자 구분 없이 인식', () => {
            const dxf = `0
HATCH
8
Layer1
2
solid
92
7
93
3
10
0.0
20
0.0
10
10.0
20
0.0
10
5.0
20
10.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.isSolid).toBe(true);
        });

        it('Windows 줄바꿈(CRLF) 처리', () => {
            const dxf = `0\r\nHATCH\r\n8\r\nLayer1\r\n2\r\nSOLID\r\n92\r\n7\r\n93\r\n3\r\n10\r\n0.0\r\n20\r\n0.0\r\n10\r\n10.0\r\n20\r\n0.0\r\n10\r\n5.0\r\n20\r\n10.0`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            expect(result[0]!.patternName).toBe('SOLID');
        });

        it('정점 좌표 정확성 검증', () => {
            const dxf = `0
HATCH
8
TestLayer
2
SOLID
92
7
93
3
10
12.5
20
34.7
10
56.8
20
78.9
10
90.1
20
23.4`;
            const result = parseHatchesFromDxf(dxf);

            expect(result).toHaveLength(1);
            const boundary = result[0]!.boundaries[0]!;
            expect(boundary.type).toBe('polyline');
            if (boundary.type === 'polyline') {
                expect(boundary.vertices[0]).toEqual({
                    x: 12.5,
                    y: 34.7,
                    z: 0,
                });
                expect(boundary.vertices[1]).toEqual({
                    x: 56.8,
                    y: 78.9,
                    z: 0,
                });
                expect(boundary.vertices[2]).toEqual({
                    x: 90.1,
                    y: 23.4,
                    z: 0,
                });
            }
        });
    });
});
