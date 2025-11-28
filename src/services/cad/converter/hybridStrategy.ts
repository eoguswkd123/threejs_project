/**
 * 하이브리드 변환 전략
 * 파일 크기/복잡도에 따라 프론트엔드 또는 백엔드 변환 선택
 */

import type {
    CADFile,
    CADData,
    ComplexityScore,
    ConversionResult,
    ConversionOptions,
} from '@types/cad';
import { dxfParser } from '../parser';
import { convertCADToThree } from './toThreeGeometry';

// 변환 임계값 설정
export const CONVERSION_THRESHOLDS = {
    // 프론트엔드 처리 가능한 최대 파일 크기 (1MB)
    MAX_FRONTEND_FILE_SIZE: 1024 * 1024,

    // 프론트엔드 처리 가능한 최대 엔티티 수
    MAX_FRONTEND_ENTITY_COUNT: 10000,

    // 복잡도 점수 임계값 (0-100)
    COMPLEXITY_THRESHOLD: 50,
} as const;

/**
 * 파일 복잡도 분석
 */
export async function analyzeComplexity(file: CADFile): Promise<ComplexityScore> {
    const fileSize = file.size;
    const fileSizeMB = fileSize / (1024 * 1024);

    // 파일 크기 기반 초기 점수 (0-50)
    let score = Math.min(50, fileSizeMB * 25);

    // 예상 엔티티 수 (경험적 추정: 1KB당 약 10-20개 엔티티)
    const estimatedEntityCount = Math.floor(fileSize / 100);

    // 엔티티 수 기반 추가 점수 (0-50)
    score += Math.min(50, (estimatedEntityCount / CONVERSION_THRESHOLDS.MAX_FRONTEND_ENTITY_COUNT) * 50);

    // 점수 정규화 (0-100)
    score = Math.min(100, Math.round(score));

    return {
        entityCount: estimatedEntityCount,
        layerCount: 0, // 파싱 전에는 알 수 없음
        fileSize,
        score,
        recommendation:
            score > CONVERSION_THRESHOLDS.COMPLEXITY_THRESHOLD ? 'backend' : 'frontend',
    };
}

/**
 * 하이브리드 변환 전략 클래스
 */
export class HybridConversionStrategy {
    private backendUrl?: string;

    constructor(backendUrl?: string) {
        this.backendUrl = backendUrl;
    }

    /**
     * 백엔드 사용 여부 결정
     */
    shouldUseBackend(complexity: ComplexityScore): boolean {
        // 백엔드 URL이 설정되지 않으면 항상 프론트엔드 사용
        if (!this.backendUrl) {
            return false;
        }

        return (
            complexity.score > CONVERSION_THRESHOLDS.COMPLEXITY_THRESHOLD ||
            complexity.fileSize > CONVERSION_THRESHOLDS.MAX_FRONTEND_FILE_SIZE
        );
    }

    /**
     * 파일 변환 (자동 라우팅)
     */
    async convert(
        file: CADFile,
        options?: ConversionOptions
    ): Promise<ConversionResult> {
        const startTime = performance.now();
        const complexity = await analyzeComplexity(file);

        if (this.shouldUseBackend(complexity)) {
            return this.convertOnServer(file, options);
        }

        return this.convertLocally(file, options);
    }

    /**
     * 프론트엔드에서 변환
     */
    async convertLocally(
        file: CADFile,
        options?: ConversionOptions
    ): Promise<ConversionResult> {
        const startTime = performance.now();

        try {
            // 파일 내용 읽기
            const content = await file.file.text();

            // DXF 파싱
            const parseResult = await dxfParser.parse(content);

            if (!parseResult.success || !parseResult.data) {
                throw new Error(
                    parseResult.errors?.map((e) => e.message).join(', ') ?? 'Parse failed'
                );
            }

            // Three.js로 변환
            const group = convertCADToThree(parseResult.data, options);

            // ConversionResult 생성
            const conversionTime = performance.now() - startTime;

            return {
                success: true,
                geometries: [], // Three.js Group으로 직접 반환하므로 비워둠
                materials: [],
                bounds: parseResult.data.bounds,
                conversionTime,
                source: 'frontend',
                // 추가 데이터를 위한 확장
                _threeGroup: group,
                _cadData: parseResult.data,
            } as ConversionResult & { _threeGroup: THREE.Group; _cadData: CADData };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Frontend conversion failed: ${message}`);
        }
    }

    /**
     * 백엔드 서버에서 변환
     */
    async convertOnServer(
        file: CADFile,
        options?: ConversionOptions
    ): Promise<ConversionResult> {
        const startTime = performance.now();

        if (!this.backendUrl) {
            // 백엔드 없으면 프론트엔드로 폴백
            console.warn('Backend URL not configured, falling back to frontend conversion');
            return this.convertLocally(file, options);
        }

        try {
            const formData = new FormData();
            formData.append('file', file.file);

            if (options) {
                formData.append('options', JSON.stringify(options));
            }

            const response = await fetch(`${this.backendUrl}/api/cad/convert`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const conversionTime = performance.now() - startTime;

            return {
                ...result,
                conversionTime,
                source: 'backend',
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';

            // 백엔드 실패 시 프론트엔드로 폴백
            console.warn(`Backend conversion failed (${message}), falling back to frontend`);
            return this.convertLocally(file, options);
        }
    }

    /**
     * 백엔드 URL 설정
     */
    setBackendUrl(url: string): void {
        this.backendUrl = url;
    }

    /**
     * 백엔드 연결 상태 확인
     */
    async checkBackendHealth(): Promise<boolean> {
        if (!this.backendUrl) {
            return false;
        }

        try {
            const response = await fetch(`${this.backendUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// 기본 인스턴스 (백엔드 URL 없이 시작)
export const hybridConverter = new HybridConversionStrategy();

// 타입 확장 (Three.js Group 포함)
declare module '@types/cad' {
    interface ConversionResult {
        _threeGroup?: import('three').Group;
        _cadData?: CADData;
    }
}
