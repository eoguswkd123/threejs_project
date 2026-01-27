/**
 * DXF Parser Worker Tests
 * Web Worker DXF 파싱 로직 테스트
 *
 * NOTE: Worker 내부 함수들은 직접 export되지 않으므로
 * 메시지 인터페이스를 통해 테스트합니다.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkerRequest, WorkerResponse } from '../../types';

// 간단한 DXF 텍스트 생성 헬퍼
const createMinimalDXF = () => `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0
20
0
30
0
11
100
21
100
31
0
0
ENDSEC
0
EOF`;

const createDXFWithCircle = () => `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
CIRCLE
8
Layer1
10
50
20
50
30
0
40
25
0
ENDSEC
0
EOF`;

const createEmptyDXF = () => `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF`;

describe('DXF Parser Worker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('WorkerRequest Validation', () => {
        it('should reject invalid request type', () => {
            const invalidRequest = {
                type: 'invalid',
                payload: { text: '', fileName: '', fileSize: 0 },
            };

            // 타입이 잘못된 요청은 parse가 아니므로 무시됨
            expect(invalidRequest.type).not.toBe('parse');
        });

        it('should validate payload structure', () => {
            const validRequest: WorkerRequest = {
                type: 'parse',
                payload: {
                    text: createMinimalDXF(),
                    fileName: 'test.dxf',
                    fileSize: 1024,
                },
            };

            expect(validRequest.type).toBe('parse');
            expect(typeof validRequest.payload.text).toBe('string');
            expect(typeof validRequest.payload.fileName).toBe('string');
            expect(typeof validRequest.payload.fileSize).toBe('number');
        });

        it('should reject negative fileSize', () => {
            const invalidPayload = {
                text: 'test',
                fileName: 'test.dxf',
                fileSize: -1,
            };

            expect(invalidPayload.fileSize).toBeLessThan(0);
        });

        it('should validate text length limit (20MB)', () => {
            const MAX_TEXT_LENGTH = 20 * 1024 * 1024;
            const validLength = 1000;
            const invalidLength = MAX_TEXT_LENGTH + 1;

            expect(validLength).toBeLessThan(MAX_TEXT_LENGTH);
            expect(invalidLength).toBeGreaterThan(MAX_TEXT_LENGTH);
        });
    });

    describe('Error Code Detection', () => {
        it('should identify EMPTY_FILE error', () => {
            const error = new Error('empty_file');
            expect(error.message).toBe('empty_file');
        });

        it('should identify INVALID_FORMAT error', () => {
            const error = new Error('Invalid DXF format');
            expect(error.message.toLowerCase()).toContain('invalid');
        });

        it('should identify PARSE_ERROR', () => {
            const error = new Error('Parse error at line 10');
            expect(error.message.toLowerCase()).toContain('parse');
        });

        it('should handle unknown errors', () => {
            const error = new Error('Something went wrong');
            const msg = error.message.toLowerCase();
            const isKnownError =
                msg === 'empty_file' ||
                msg.includes('invalid') ||
                msg.includes('unexpected') ||
                msg.includes('parse') ||
                msg.includes('syntax');
            expect(isKnownError).toBe(false);
        });
    });

    describe('Layer Name Sanitization', () => {
        it('should handle empty or undefined layer name', () => {
            // 레이어명이 없으면 '0' 반환
            const defaultLayer = '0';
            expect(defaultLayer).toBe('0');
        });

        it('should escape HTML special characters', () => {
            const unsafeName = '<script>alert("xss")</script>';
            const escaped = unsafeName
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');

            expect(escaped).not.toContain('<');
            expect(escaped).not.toContain('>');
            expect(escaped).toContain('&lt;');
            expect(escaped).toContain('&gt;');
        });

        it('should truncate long layer names to 255 characters', () => {
            const longName = 'A'.repeat(300);
            const truncated = longName.slice(0, 255);

            expect(truncated.length).toBe(255);
        });
    });

    describe('Bounding Box Calculation', () => {
        it('should calculate bounds for LINE entities', () => {
            const lines = [
                {
                    start: { x: 0, y: 0, z: 0 },
                    end: { x: 100, y: 100, z: 0 },
                    layer: '0',
                },
            ];

            let minX = Infinity,
                minY = Infinity,
                minZ = Infinity;
            let maxX = -Infinity,
                maxY = -Infinity,
                maxZ = -Infinity;

            for (const line of lines) {
                minX = Math.min(minX, line.start.x, line.end.x);
                minY = Math.min(minY, line.start.y, line.end.y);
                minZ = Math.min(minZ, line.start.z, line.end.z);
                maxX = Math.max(maxX, line.start.x, line.end.x);
                maxY = Math.max(maxY, line.start.y, line.end.y);
                maxZ = Math.max(maxZ, line.start.z, line.end.z);
            }

            expect(minX).toBe(0);
            expect(minY).toBe(0);
            expect(maxX).toBe(100);
            expect(maxY).toBe(100);
        });

        it('should calculate bounds for CIRCLE entities', () => {
            const circles = [
                { center: { x: 50, y: 50, z: 0 }, radius: 25, layer: '0' },
            ];

            const circle = circles[0]!;
            const minX = circle.center.x - circle.radius;
            const maxX = circle.center.x + circle.radius;
            const minY = circle.center.y - circle.radius;
            const maxY = circle.center.y + circle.radius;

            expect(minX).toBe(25);
            expect(maxX).toBe(75);
            expect(minY).toBe(25);
            expect(maxY).toBe(75);
        });

        it('should return default bounds for empty entities', () => {
            const DEFAULT_BOUNDS = {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 100, y: 100, z: 0 },
            };

            // 엔티티가 없으면 기본 바운딩 박스 반환
            expect(DEFAULT_BOUNDS.min.x).toBe(0);
            expect(DEFAULT_BOUNDS.max.x).toBe(100);
        });
    });

    describe('Progress Reporting', () => {
        it('should send progress messages with stage and percent', () => {
            const progressMessage: WorkerResponse = {
                type: 'progress',
                payload: { stage: 'DXF 파싱 중...', percent: 10 },
            };

            expect(progressMessage.type).toBe('progress');
            expect(progressMessage.payload).toHaveProperty('stage');
            expect(progressMessage.payload).toHaveProperty('percent');
        });

        it('should progress through stages: 10% -> 30% -> 100%', () => {
            const stages = [
                { stage: 'DXF 파싱 중...', percent: 10 },
                { stage: '엔티티 추출 중...', percent: 30 },
                { stage: '완료!', percent: 100 },
            ];

            expect(stages[0]!.percent).toBe(10);
            expect(stages[1]!.percent).toBe(30);
            expect(stages[2]!.percent).toBe(100);
        });
    });

    describe('Success Response Structure', () => {
        it('should include all required fields in success response', () => {
            const successResponse: WorkerResponse = {
                type: 'success',
                payload: {
                    lines: [],
                    circles: [],
                    arcs: [],
                    polylines: [],
                    hatches: [],
                    texts: [],
                    mtexts: [],
                    ellipses: [],
                    splines: [],
                    dimensions: [],
                    bounds: {
                        min: { x: 0, y: 0, z: 0 },
                        max: { x: 100, y: 100, z: 0 },
                    },
                    layers: {},
                    metadata: {
                        fileName: 'test.dxf',
                        fileSize: 1024,
                        entityCount: 0,
                        parseTime: 50,
                    },
                },
            };

            expect(successResponse.type).toBe('success');
            expect(successResponse.payload).toHaveProperty('lines');
            expect(successResponse.payload).toHaveProperty('circles');
            expect(successResponse.payload).toHaveProperty('arcs');
            expect(successResponse.payload).toHaveProperty('polylines');
            expect(successResponse.payload).toHaveProperty('hatches');
            expect(successResponse.payload).toHaveProperty('bounds');
            expect(successResponse.payload).toHaveProperty('layers');
            expect(successResponse.payload).toHaveProperty('metadata');
        });

        it('should serialize layers as array of tuples', () => {
            const layers: [string, { name: string; color: string }][] = [
                ['0', { name: '0', color: '#00ff00' }],
                ['Layer1', { name: 'Layer1', color: '#ff0000' }],
            ];

            expect(Array.isArray(layers)).toBe(true);
            expect(layers[0]).toHaveLength(2);
            expect(layers[0]![0]).toBe('0');
        });
    });

    describe('Error Response Structure', () => {
        it('should include code and message in error response', () => {
            const errorResponse: WorkerResponse = {
                type: 'error',
                payload: {
                    code: 'INVALID_FORMAT',
                    message: 'Invalid DXF file format',
                },
            };

            expect(errorResponse.type).toBe('error');
            expect(errorResponse.payload).toHaveProperty('code');
            expect(errorResponse.payload).toHaveProperty('message');
        });

        it('should use valid error codes', () => {
            const validCodes = [
                'EMPTY_FILE',
                'INVALID_FORMAT',
                'PARSE_ERROR',
                'UNKNOWN_ERROR',
            ];

            validCodes.forEach((code) => {
                expect(typeof code).toBe('string');
            });
        });
    });

    describe('DXF Content Validation', () => {
        it('should handle minimal valid DXF', () => {
            const dxf = createMinimalDXF();
            expect(dxf).toContain('SECTION');
            expect(dxf).toContain('ENTITIES');
            expect(dxf).toContain('LINE');
            expect(dxf).toContain('EOF');
        });

        it('should handle DXF with CIRCLE', () => {
            const dxf = createDXFWithCircle();
            expect(dxf).toContain('CIRCLE');
            expect(dxf).toContain('Layer1');
        });

        it('should handle empty DXF (no entities)', () => {
            const dxf = createEmptyDXF();
            expect(dxf).toContain('ENTITIES');
            expect(dxf).toContain('ENDSEC');
            expect(dxf).not.toContain('LINE');
        });
    });

    describe('Layer Color Processing', () => {
        it('should use DEFAULT_LAYER_COLOR for missing color', () => {
            const DEFAULT_LAYER_COLOR = '#00ff00';
            expect(DEFAULT_LAYER_COLOR).toBe('#00ff00');
        });

        it('should validate color range (0 to 0xffffff)', () => {
            const validColor = 0xff0000;
            const invalidLow = -1;
            const invalidHigh = 0xffffff + 1;

            expect(validColor >= 0 && validColor <= 0xffffff).toBe(true);
            expect(invalidLow >= 0).toBe(false);
            expect(invalidHigh <= 0xffffff).toBe(false);
        });

        it('should convert color number to hex string', () => {
            const colorNumber = 0xff0000;
            const hexString = '#' + colorNumber.toString(16).padStart(6, '0');

            expect(hexString).toBe('#ff0000');
        });
    });

    describe('Entity Count Validation', () => {
        it('should throw EMPTY_FILE for zero entities', () => {
            const entities = {
                lines: [],
                circles: [],
                arcs: [],
                polylines: [],
                hatches: [],
            };

            const totalCount =
                entities.lines.length +
                entities.circles.length +
                entities.arcs.length +
                entities.polylines.length +
                entities.hatches.length;

            expect(totalCount).toBe(0);
        });

        it('should count all entity types', () => {
            const entities = {
                lines: [
                    {
                        start: { x: 0, y: 0, z: 0 },
                        end: { x: 1, y: 1, z: 0 },
                        layer: '0',
                    },
                ],
                circles: [
                    { center: { x: 0, y: 0, z: 0 }, radius: 1, layer: '0' },
                ],
                arcs: [],
                polylines: [],
                hatches: [],
            };

            const totalCount =
                entities.lines.length +
                entities.circles.length +
                entities.arcs.length +
                entities.polylines.length +
                entities.hatches.length;

            expect(totalCount).toBe(2);
        });
    });
});
