/**
 * validators.test.ts
 * CADViewer 파일 유효성 검사 함수 테스트
 */

import { describe, it, expect } from 'vitest';

import { FILE_LIMITS } from '../../constants';
import {
    validateFileExtension,
    validateFileSize,
    validateFileContent,
    validateFile,
    shouldShowSizeWarning,
    formatFileSize,
} from '../validators';

// 테스트용 File 객체 생성 헬퍼
function createTestFile(
    name: string,
    sizeInBytes: number = 100,
    type: string = ''
): File {
    const content = new ArrayBuffer(sizeInBytes);
    return new File([content], name, { type });
}

describe('validators', () => {
    describe('validateFileExtension', () => {
        it('올바른 DXF 확장자면 valid: true 반환', () => {
            const file = createTestFile('test.dxf');
            const result = validateFileExtension(file);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('대소문자 무관하게 DXF 확장자 허용', () => {
            const files = [
                createTestFile('test.DXF'),
                createTestFile('test.Dxf'),
                createTestFile('TEST.dxf'),
            ];

            files.forEach((file) => {
                const result = validateFileExtension(file);
                expect(result.valid).toBe(true);
            });
        });

        it('DXF가 아닌 확장자면 valid: false와 에러 반환', () => {
            const invalidFiles = [
                createTestFile('test.pdf'),
                createTestFile('test.dwg'),
                createTestFile('test.txt'),
                createTestFile('test'),
            ];

            invalidFiles.forEach((file) => {
                const result = validateFileExtension(file);
                expect(result.valid).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error?.code).toBe('INVALID_TYPE');
            });
        });
    });

    describe('validateFileSize', () => {
        it('최대 크기 이하면 valid: true 반환', () => {
            const file = createTestFile('test.dxf', 1024); // 1KB
            const result = validateFileSize(file);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('최대 크기와 정확히 같으면 valid: true 반환', () => {
            const file = createTestFile('test.dxf', FILE_LIMITS.MAX_SIZE_BYTES);
            const result = validateFileSize(file);

            expect(result.valid).toBe(true);
        });

        it('최대 크기 초과면 valid: false와 에러 반환', () => {
            const file = createTestFile(
                'test.dxf',
                FILE_LIMITS.MAX_SIZE_BYTES + 1
            );
            const result = validateFileSize(file);

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error?.code).toBe('FILE_TOO_LARGE');
        });
    });

    describe('validateFileContent', () => {
        it('내용이 있는 파일이면 valid: true 반환', () => {
            const file = createTestFile('test.dxf', 100);
            const result = validateFileContent(file);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('빈 파일이면 valid: false와 에러 반환', () => {
            const file = createTestFile('test.dxf', 0);
            const result = validateFileContent(file);

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error?.code).toBe('EMPTY_FILE');
        });
    });

    describe('validateFile', () => {
        it('모든 조건 충족 시 valid: true 반환', () => {
            const file = createTestFile('test.dxf', 1024);
            const result = validateFile(file);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('확장자 오류 시 해당 에러 반환', () => {
            const file = createTestFile('test.pdf', 1024);
            const result = validateFile(file);

            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_TYPE');
        });

        it('크기 초과 시 해당 에러 반환 (확장자 검사 통과 후)', () => {
            const file = createTestFile(
                'test.dxf',
                FILE_LIMITS.MAX_SIZE_BYTES + 1
            );
            const result = validateFile(file);

            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('FILE_TOO_LARGE');
        });

        it('빈 파일 시 해당 에러 반환 (확장자, 크기 검사 통과 후)', () => {
            const file = createTestFile('test.dxf', 0);
            const result = validateFile(file);

            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('EMPTY_FILE');
        });
    });

    describe('shouldShowSizeWarning', () => {
        it('경고 크기 초과 시 true 반환', () => {
            const file = createTestFile(
                'test.dxf',
                FILE_LIMITS.WARNING_SIZE_BYTES + 1
            );
            expect(shouldShowSizeWarning(file)).toBe(true);
        });

        it('경고 크기 이하면 false 반환', () => {
            const file = createTestFile(
                'test.dxf',
                FILE_LIMITS.WARNING_SIZE_BYTES
            );
            expect(shouldShowSizeWarning(file)).toBe(false);
        });

        it('경고 크기 미만이면 false 반환', () => {
            const file = createTestFile(
                'test.dxf',
                FILE_LIMITS.WARNING_SIZE_BYTES - 1
            );
            expect(shouldShowSizeWarning(file)).toBe(false);
        });
    });

    describe('formatFileSize', () => {
        it('1024 바이트 미만은 B 단위로 표시', () => {
            expect(formatFileSize(0)).toBe('0 B');
            expect(formatFileSize(100)).toBe('100 B');
            expect(formatFileSize(1023)).toBe('1023 B');
        });

        it('1MB 미만은 KB 단위로 표시', () => {
            expect(formatFileSize(1024)).toBe('1.0 KB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
            expect(formatFileSize(1024 * 500)).toBe('500.0 KB');
        });

        it('1MB 이상은 MB 단위로 표시', () => {
            expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
            expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB');
            expect(formatFileSize(1024 * 1024 * 20)).toBe('20.00 MB');
        });
    });
});
