/**
 * TextureCacheManager - True LRU Cache for Three.js Textures
 *
 * Phase 2.1.5: 자동 메모리 관리 LRU 캐시
 * - O(1) lookup: HashMap
 * - O(1) eviction: Doubly Linked List
 * - 자동 Three.js dispose() 호출
 *
 * @see {@link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU}
 */

import type * as THREE from 'three';

/** 캐시 통계 */
export interface CacheStats {
    /** 캐시 항목 수 */
    size: number;
    /** 최대 캐시 크기 */
    maxSize: number;
    /** 캐시 히트 수 */
    hits: number;
    /** 캐시 미스 수 */
    misses: number;
    /** 히트율 (0-1) */
    hitRate: number;
    /** 총 메모리 사용량 (bytes, 추정치) */
    memoryUsage: number;
}

/** 캐시 설정 */
export interface TextureCacheConfig {
    /** 최대 캐시 항목 수 */
    maxSize: number;
    /** 최대 메모리 사용량 (bytes, 0=무제한) */
    maxMemory: number;
    /** 텍스처당 기본 메모리 크기 (bytes) */
    defaultTextureMemory: number;
}

/** 기본 캐시 설정 */
export const DEFAULT_TEXTURE_CACHE_CONFIG: TextureCacheConfig = {
    maxSize: 100,
    maxMemory: 50 * 1024 * 1024, // 50MB
    defaultTextureMemory: 128 * 128 * 4, // 128x128 RGBA
};

/** Doubly Linked List 노드 */
interface CacheNode<T> {
    key: string;
    value: T;
    memorySize: number;
    prev: CacheNode<T> | null;
    next: CacheNode<T> | null;
}

/** Three.js Texture와 유사한 인터페이스 (dispose 메서드 포함) */
interface Disposable {
    dispose(): void;
}

/**
 * True LRU Cache for Three.js Textures
 *
 * HashMap + Doubly Linked List 구조:
 * - get/set: O(1)
 * - eviction: O(1) - 가장 오래된 항목 자동 제거
 *
 * @example
 * ```typescript
 * const cache = new LRUTextureCache<THREE.Texture>();
 * cache.set('pattern-ANSI31', texture);
 * const cached = cache.get('pattern-ANSI31'); // 히트, MRU로 이동
 * ```
 */
export class LRUTextureCache<T extends Disposable> {
    private map: Map<string, CacheNode<T>>;
    private head: CacheNode<T> | null = null; // Most Recently Used
    private tail: CacheNode<T> | null = null; // Least Recently Used
    private config: TextureCacheConfig;

    // 통계
    private hits = 0;
    private misses = 0;
    private totalMemory = 0;

    constructor(config: Partial<TextureCacheConfig> = {}) {
        this.config = { ...DEFAULT_TEXTURE_CACHE_CONFIG, ...config };
        this.map = new Map();
    }

    /**
     * 캐시에서 항목 조회
     * 조회 시 MRU(Most Recently Used) 위치로 이동
     */
    get(key: string): T | undefined {
        const node = this.map.get(key);
        if (!node) {
            this.misses++;
            return undefined;
        }

        this.hits++;

        // 이미 head이면 이동 불필요
        if (node === this.head) {
            return node.value;
        }

        // 노드를 리스트에서 분리
        this.removeFromList(node);

        // head로 이동 (MRU)
        this.addToHead(node);

        return node.value;
    }

    /**
     * 캐시에 항목 저장
     * 용량 초과 시 LRU 항목 자동 제거
     *
     * @param key 캐시 키
     * @param value Three.js Texture 또는 Disposable 객체
     * @param memorySize 메모리 크기 (bytes, 선택적)
     */
    set(key: string, value: T, memorySize?: number): void {
        const actualMemory = memorySize ?? this.config.defaultTextureMemory;

        // 이미 존재하면 업데이트
        const existing = this.map.get(key);
        if (existing) {
            // 기존 값 dispose
            existing.value.dispose();
            this.totalMemory -= existing.memorySize;

            // 값 업데이트
            existing.value = value;
            existing.memorySize = actualMemory;
            this.totalMemory += actualMemory;

            // MRU로 이동
            this.removeFromList(existing);
            this.addToHead(existing);
            return;
        }

        // 용량 확보 (새 항목 추가 전)
        this.ensureCapacity(actualMemory);

        // 새 노드 생성
        const node: CacheNode<T> = {
            key,
            value,
            memorySize: actualMemory,
            prev: null,
            next: null,
        };

        // 맵에 추가
        this.map.set(key, node);
        this.totalMemory += actualMemory;

        // head로 추가 (MRU)
        this.addToHead(node);
    }

    /**
     * 캐시에 항목 존재 여부 확인 (접근 시간 갱신 없음)
     */
    has(key: string): boolean {
        return this.map.has(key);
    }

    /**
     * 캐시에서 항목 삭제
     */
    delete(key: string): boolean {
        const node = this.map.get(key);
        if (!node) {
            return false;
        }

        // dispose 호출
        node.value.dispose();
        this.totalMemory -= node.memorySize;

        // 리스트에서 제거
        this.removeFromList(node);

        // 맵에서 제거
        this.map.delete(key);

        return true;
    }

    /**
     * 캐시 전체 비우기
     * 모든 텍스처의 dispose() 호출
     */
    clear(): void {
        // 모든 항목 dispose
        for (const node of this.map.values()) {
            node.value.dispose();
        }

        // 상태 초기화
        this.map.clear();
        this.head = null;
        this.tail = null;
        this.totalMemory = 0;
        // 통계는 유지 (clear 후에도 히트율 확인 가능)
    }

    /**
     * 캐시 통계 조회
     */
    getStats(): CacheStats {
        const totalRequests = this.hits + this.misses;
        return {
            size: this.map.size,
            maxSize: this.config.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
            memoryUsage: this.totalMemory,
        };
    }

    /**
     * 통계 초기화
     */
    resetStats(): void {
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * 현재 캐시 크기
     */
    get size(): number {
        return this.map.size;
    }

    // ========================================
    // Private Methods
    // ========================================

    /**
     * 용량 확보 (LRU eviction)
     * maxSize 또는 maxMemory 초과 시 tail(LRU)부터 제거
     */
    private ensureCapacity(newItemMemory: number): void {
        // maxSize 체크
        while (this.map.size >= this.config.maxSize && this.tail) {
            this.evictLRU();
        }

        // maxMemory 체크 (0이면 무제한)
        if (this.config.maxMemory > 0) {
            while (
                this.totalMemory + newItemMemory > this.config.maxMemory &&
                this.tail
            ) {
                this.evictLRU();
            }
        }
    }

    /**
     * LRU 항목 제거 (tail)
     */
    private evictLRU(): void {
        if (!this.tail) return;

        const lru = this.tail;

        // dispose 호출
        lru.value.dispose();
        this.totalMemory -= lru.memorySize;

        // 리스트에서 제거
        this.removeFromList(lru);

        // 맵에서 제거
        this.map.delete(lru.key);
    }

    /**
     * 노드를 리스트에서 분리
     */
    private removeFromList(node: CacheNode<T>): void {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            // node가 head인 경우
            this.head = node.next;
        }

        if (node.next) {
            node.next.prev = node.prev;
        } else {
            // node가 tail인 경우
            this.tail = node.prev;
        }

        node.prev = null;
        node.next = null;
    }

    /**
     * 노드를 head(MRU)로 추가
     */
    private addToHead(node: CacheNode<T>): void {
        node.next = this.head;
        node.prev = null;

        if (this.head) {
            this.head.prev = node;
        }

        this.head = node;

        // 리스트가 비어있었으면 tail도 설정
        if (!this.tail) {
            this.tail = node;
        }
    }
}

// ========================================
// 글로벌 캐시 인스턴스
// ========================================

/** 패턴 텍스처 캐시 (싱글턴) */
let patternTextureCacheInstance: LRUTextureCache<THREE.Texture> | null = null;

/**
 * 패턴 텍스처 캐시 인스턴스 가져오기
 * @param config 캐시 설정 (첫 호출 시에만 적용)
 */
export function getPatternTextureCache(
    config?: Partial<TextureCacheConfig>
): LRUTextureCache<THREE.Texture> {
    if (!patternTextureCacheInstance) {
        patternTextureCacheInstance = new LRUTextureCache<THREE.Texture>(
            config
        );
    }
    return patternTextureCacheInstance;
}

/**
 * 패턴 텍스처 캐시 초기화 (테스트용)
 */
export function resetPatternTextureCache(): void {
    if (patternTextureCacheInstance) {
        patternTextureCacheInstance.clear();
        patternTextureCacheInstance = null;
    }
}
