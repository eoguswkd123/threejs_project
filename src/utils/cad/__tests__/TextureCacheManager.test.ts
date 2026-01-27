/**
 * TextureCacheManager.test.ts
 * Phase 2.1.5: LRU Texture Cache 테스트
 *
 * 테스트 범위:
 * - LRU eviction 로직
 * - 메모리 제한 동작
 * - 통계 추적
 * - 싱글턴 패턴
 * - dispose 자동 호출
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
    LRUTextureCache,
    DEFAULT_TEXTURE_CACHE_CONFIG,
    getPatternTextureCache,
    resetPatternTextureCache,
} from '../TextureCacheManager';

// ============================================================
// Test Helpers
// ============================================================

/** Mock Disposable 객체 생성 */
function createMockDisposable(id: string = 'mock'): {
    dispose: ReturnType<typeof vi.fn>;
    id: string;
} {
    return {
        dispose: vi.fn(),
        id,
    };
}

/** 여러 Mock Disposable 생성 */
function createMockDisposables(
    count: number
): Array<ReturnType<typeof createMockDisposable>> {
    return Array.from({ length: count }, (_, i) =>
        createMockDisposable(`mock-${i}`)
    );
}

// ============================================================
// DEFAULT_TEXTURE_CACHE_CONFIG Tests
// ============================================================

describe('DEFAULT_TEXTURE_CACHE_CONFIG', () => {
    it('should have correct default values', () => {
        expect(DEFAULT_TEXTURE_CACHE_CONFIG.maxSize).toBe(100);
        expect(DEFAULT_TEXTURE_CACHE_CONFIG.maxMemory).toBe(50 * 1024 * 1024); // 50MB
        expect(DEFAULT_TEXTURE_CACHE_CONFIG.defaultTextureMemory).toBe(
            128 * 128 * 4
        ); // 128x128 RGBA
    });

    it('should calculate correct default texture memory for 128x128 RGBA', () => {
        const expectedMemory = 128 * 128 * 4; // width * height * 4 bytes (RGBA)
        expect(DEFAULT_TEXTURE_CACHE_CONFIG.defaultTextureMemory).toBe(
            expectedMemory
        );
        expect(expectedMemory).toBe(65536); // 64KB
    });
});

// ============================================================
// LRUTextureCache - Basic Operations
// ============================================================

describe('LRUTextureCache - Basic Operations', () => {
    let cache: LRUTextureCache<ReturnType<typeof createMockDisposable>>;

    beforeEach(() => {
        cache = new LRUTextureCache({ maxSize: 5, maxMemory: 0 });
    });

    afterEach(() => {
        cache.clear();
    });

    describe('constructor', () => {
        it('should create cache with default config', () => {
            const defaultCache = new LRUTextureCache();
            const stats = defaultCache.getStats();

            expect(stats.maxSize).toBe(DEFAULT_TEXTURE_CACHE_CONFIG.maxSize);
            expect(stats.size).toBe(0);

            defaultCache.clear();
        });

        it('should create cache with custom config', () => {
            const customCache = new LRUTextureCache({
                maxSize: 10,
                maxMemory: 1024,
            });
            const stats = customCache.getStats();

            expect(stats.maxSize).toBe(10);

            customCache.clear();
        });

        it('should merge partial config with defaults', () => {
            const partialCache = new LRUTextureCache({ maxSize: 50 });
            const stats = partialCache.getStats();

            expect(stats.maxSize).toBe(50);

            partialCache.clear();
        });
    });

    describe('set', () => {
        it('should add item to cache', () => {
            const item = createMockDisposable();
            cache.set('key1', item);

            expect(cache.size).toBe(1);
            expect(cache.has('key1')).toBe(true);
        });

        it('should update existing item and call dispose on old value', () => {
            const item1 = createMockDisposable('first');
            const item2 = createMockDisposable('second');

            cache.set('key1', item1);
            cache.set('key1', item2);

            expect(cache.size).toBe(1);
            expect(item1.dispose).toHaveBeenCalledTimes(1);
            expect(cache.get('key1')).toBe(item2);
        });

        it('should accept custom memory size', () => {
            const item = createMockDisposable();
            const customMemory = 1024 * 1024; // 1MB

            cache.set('key1', item, customMemory);

            const stats = cache.getStats();
            expect(stats.memoryUsage).toBe(customMemory);
        });

        it('should use default memory size when not provided', () => {
            const item = createMockDisposable();
            cache.set('key1', item);

            const stats = cache.getStats();
            expect(stats.memoryUsage).toBe(
                DEFAULT_TEXTURE_CACHE_CONFIG.defaultTextureMemory
            );
        });
    });

    describe('get', () => {
        it('should return item if exists', () => {
            const item = createMockDisposable();
            cache.set('key1', item);

            expect(cache.get('key1')).toBe(item);
        });

        it('should return undefined if not exists', () => {
            expect(cache.get('nonexistent')).toBeUndefined();
        });

        it('should increment hits on successful get', () => {
            const item = createMockDisposable();
            cache.set('key1', item);

            cache.get('key1');
            cache.get('key1');

            const stats = cache.getStats();
            expect(stats.hits).toBe(2);
        });

        it('should increment misses on failed get', () => {
            cache.get('nonexistent');
            cache.get('another');

            const stats = cache.getStats();
            expect(stats.misses).toBe(2);
        });
    });

    describe('has', () => {
        it('should return true if key exists', () => {
            cache.set('key1', createMockDisposable());

            expect(cache.has('key1')).toBe(true);
        });

        it('should return false if key does not exist', () => {
            expect(cache.has('nonexistent')).toBe(false);
        });

        it('should not affect hit/miss statistics', () => {
            cache.set('key1', createMockDisposable());

            cache.has('key1');
            cache.has('nonexistent');

            const stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });
    });

    describe('delete', () => {
        it('should remove item and return true', () => {
            const item = createMockDisposable();
            cache.set('key1', item);

            const result = cache.delete('key1');

            expect(result).toBe(true);
            expect(cache.has('key1')).toBe(false);
            expect(cache.size).toBe(0);
        });

        it('should call dispose on deleted item', () => {
            const item = createMockDisposable();
            cache.set('key1', item);

            cache.delete('key1');

            expect(item.dispose).toHaveBeenCalledTimes(1);
        });

        it('should return false if key does not exist', () => {
            const result = cache.delete('nonexistent');

            expect(result).toBe(false);
        });

        it('should update memory usage', () => {
            const customMemory = 1024;
            cache.set('key1', createMockDisposable(), customMemory);

            expect(cache.getStats().memoryUsage).toBe(customMemory);

            cache.delete('key1');

            expect(cache.getStats().memoryUsage).toBe(0);
        });
    });

    describe('clear', () => {
        it('should remove all items', () => {
            cache.set('key1', createMockDisposable());
            cache.set('key2', createMockDisposable());
            cache.set('key3', createMockDisposable());

            cache.clear();

            expect(cache.size).toBe(0);
        });

        it('should call dispose on all items', () => {
            const items = createMockDisposables(3);
            items.forEach((item, i) => cache.set(`key${i}`, item));

            cache.clear();

            items.forEach((item) => {
                expect(item.dispose).toHaveBeenCalledTimes(1);
            });
        });

        it('should reset memory usage to 0', () => {
            cache.set('key1', createMockDisposable(), 1024);
            cache.set('key2', createMockDisposable(), 2048);

            cache.clear();

            expect(cache.getStats().memoryUsage).toBe(0);
        });

        it('should preserve statistics after clear', () => {
            cache.set('key1', createMockDisposable());
            cache.get('key1'); // hit
            cache.get('nonexistent'); // miss

            cache.clear();

            const stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
        });
    });

    describe('size', () => {
        it('should return current cache size', () => {
            expect(cache.size).toBe(0);

            cache.set('key1', createMockDisposable());
            expect(cache.size).toBe(1);

            cache.set('key2', createMockDisposable());
            expect(cache.size).toBe(2);

            cache.delete('key1');
            expect(cache.size).toBe(1);
        });
    });
});

// ============================================================
// LRUTextureCache - LRU Eviction
// ============================================================

describe('LRUTextureCache - LRU Eviction', () => {
    describe('maxSize eviction', () => {
        it('should evict LRU item when maxSize exceeded', () => {
            const cache = new LRUTextureCache({ maxSize: 3, maxMemory: 0 });
            const items = createMockDisposables(4);

            // 순서: item0, item1, item2
            cache.set('key0', items[0]!);
            cache.set('key1', items[1]!);
            cache.set('key2', items[2]!);

            // item3 추가 시 item0 (LRU) 제거
            cache.set('key3', items[3]!);

            expect(cache.size).toBe(3);
            expect(cache.has('key0')).toBe(false); // evicted
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(true);
            expect(cache.has('key3')).toBe(true);

            // item0 dispose 호출됨
            expect(items[0]!.dispose).toHaveBeenCalledTimes(1);

            cache.clear();
        });

        it('should evict multiple items when necessary', () => {
            const cache = new LRUTextureCache({ maxSize: 2, maxMemory: 0 });
            const items = createMockDisposables(5);

            cache.set('key0', items[0]!);
            cache.set('key1', items[1]!);
            cache.set('key2', items[2]!); // key0 evicted
            cache.set('key3', items[3]!); // key1 evicted
            cache.set('key4', items[4]!); // key2 evicted

            expect(cache.size).toBe(2);
            expect(cache.has('key3')).toBe(true);
            expect(cache.has('key4')).toBe(true);

            expect(items[0]!.dispose).toHaveBeenCalled();
            expect(items[1]!.dispose).toHaveBeenCalled();
            expect(items[2]!.dispose).toHaveBeenCalled();

            cache.clear();
        });

        it('should promote item to MRU on get', () => {
            const cache = new LRUTextureCache({ maxSize: 3, maxMemory: 0 });
            const items = createMockDisposables(4);

            cache.set('key0', items[0]!);
            cache.set('key1', items[1]!);
            cache.set('key2', items[2]!);

            // key0을 조회하여 MRU로 승격
            cache.get('key0');

            // key3 추가 시 key1이 LRU이므로 제거
            cache.set('key3', items[3]!);

            expect(cache.has('key0')).toBe(true); // MRU로 승격됨
            expect(cache.has('key1')).toBe(false); // evicted
            expect(cache.has('key2')).toBe(true);
            expect(cache.has('key3')).toBe(true);

            cache.clear();
        });

        it('should promote item to MRU on set (update)', () => {
            const cache = new LRUTextureCache({ maxSize: 3, maxMemory: 0 });
            const items = createMockDisposables(5);

            cache.set('key0', items[0]!);
            cache.set('key1', items[1]!);
            cache.set('key2', items[2]!);

            // key0 업데이트하여 MRU로 승격
            cache.set('key0', items[3]!);

            // key4 추가 시 key1이 LRU이므로 제거
            cache.set('key4', items[4]!);

            expect(cache.has('key0')).toBe(true);
            expect(cache.has('key1')).toBe(false); // evicted
            expect(cache.has('key2')).toBe(true);
            expect(cache.has('key4')).toBe(true);

            cache.clear();
        });
    });

    describe('maxMemory eviction', () => {
        it('should evict items when maxMemory exceeded', () => {
            const cache = new LRUTextureCache({
                maxSize: 100,
                maxMemory: 1000,
            });
            const items = createMockDisposables(4);

            cache.set('key0', items[0]!, 400);
            cache.set('key1', items[1]!, 400);

            // 현재: 800 bytes
            // key2 (400) 추가 → 1200 > 1000, key0 제거
            cache.set('key2', items[2]!, 400);

            expect(cache.has('key0')).toBe(false);
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(true);
            expect(cache.getStats().memoryUsage).toBe(800);

            cache.clear();
        });

        it('should evict multiple items to fit new large item', () => {
            const cache = new LRUTextureCache({
                maxSize: 100,
                maxMemory: 1000,
            });
            const items = createMockDisposables(4);

            cache.set('key0', items[0]!, 300);
            cache.set('key1', items[1]!, 300);
            cache.set('key2', items[2]!, 300);

            // 현재: 900 bytes
            // key3 (500) 추가 → 1400 > 1000, key0, key1 제거 필요
            cache.set('key3', items[3]!, 500);

            expect(cache.has('key0')).toBe(false);
            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(true);
            expect(cache.has('key3')).toBe(true);
            expect(cache.getStats().memoryUsage).toBe(800);

            cache.clear();
        });

        it('should handle maxMemory=0 as unlimited', () => {
            const cache = new LRUTextureCache({ maxSize: 100, maxMemory: 0 });
            const items = createMockDisposables(10);

            // 많은 메모리 할당해도 제거되지 않음
            items.forEach((item, i) => {
                cache.set(`key${i}`, item, 10 * 1024 * 1024); // 10MB each
            });

            expect(cache.size).toBe(10);

            cache.clear();
        });
    });

    describe('combined eviction', () => {
        it('should respect both maxSize and maxMemory', () => {
            const cache = new LRUTextureCache({ maxSize: 3, maxMemory: 500 });
            const items = createMockDisposables(4);

            cache.set('key0', items[0]!, 200);
            cache.set('key1', items[1]!, 200);

            // maxSize 3, 현재 크기 2
            // maxMemory 500, 현재 메모리 400
            // key2 (200) 추가 → 600 > 500, key0 제거
            cache.set('key2', items[2]!, 200);

            expect(cache.size).toBe(2);
            expect(cache.has('key0')).toBe(false);
            expect(cache.getStats().memoryUsage).toBe(400);

            cache.clear();
        });
    });
});

// ============================================================
// LRUTextureCache - Statistics
// ============================================================

describe('LRUTextureCache - Statistics', () => {
    let cache: LRUTextureCache<ReturnType<typeof createMockDisposable>>;

    beforeEach(() => {
        cache = new LRUTextureCache({ maxSize: 10, maxMemory: 0 });
    });

    afterEach(() => {
        cache.clear();
    });

    describe('getStats', () => {
        it('should return correct initial stats', () => {
            const stats = cache.getStats();

            expect(stats.size).toBe(0);
            expect(stats.maxSize).toBe(10);
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.hitRate).toBe(0);
            expect(stats.memoryUsage).toBe(0);
        });

        it('should track hits and misses', () => {
            cache.set('key1', createMockDisposable());

            cache.get('key1'); // hit
            cache.get('key1'); // hit
            cache.get('key1'); // hit
            cache.get('nonexistent'); // miss
            cache.get('another'); // miss

            const stats = cache.getStats();
            expect(stats.hits).toBe(3);
            expect(stats.misses).toBe(2);
        });

        it('should calculate correct hit rate', () => {
            cache.set('key1', createMockDisposable());

            cache.get('key1'); // hit
            cache.get('key1'); // hit
            cache.get('key1'); // hit
            cache.get('key1'); // hit
            cache.get('nonexistent'); // miss

            const stats = cache.getStats();
            expect(stats.hitRate).toBe(0.8); // 4 hits / 5 total
        });

        it('should return 0 hit rate when no requests', () => {
            const stats = cache.getStats();
            expect(stats.hitRate).toBe(0);
        });

        it('should track memory usage correctly', () => {
            cache.set('key1', createMockDisposable(), 1000);
            cache.set('key2', createMockDisposable(), 2000);
            cache.set('key3', createMockDisposable(), 500);

            expect(cache.getStats().memoryUsage).toBe(3500);

            cache.delete('key2');
            expect(cache.getStats().memoryUsage).toBe(1500);
        });
    });

    describe('resetStats', () => {
        it('should reset hits and misses to 0', () => {
            cache.set('key1', createMockDisposable());
            cache.get('key1');
            cache.get('nonexistent');

            cache.resetStats();

            const stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
        });

        it('should not affect cache contents', () => {
            cache.set('key1', createMockDisposable());
            cache.set('key2', createMockDisposable());

            cache.resetStats();

            expect(cache.size).toBe(2);
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(true);
        });

        it('should not affect memory usage', () => {
            cache.set('key1', createMockDisposable(), 1000);

            cache.resetStats();

            expect(cache.getStats().memoryUsage).toBe(1000);
        });
    });
});

// ============================================================
// LRUTextureCache - Edge Cases
// ============================================================

describe('LRUTextureCache - Edge Cases', () => {
    it('should handle single item cache correctly', () => {
        const cache = new LRUTextureCache({ maxSize: 1, maxMemory: 0 });
        const items = createMockDisposables(3);

        cache.set('key0', items[0]!);
        expect(cache.size).toBe(1);

        cache.set('key1', items[1]!);
        expect(cache.size).toBe(1);
        expect(cache.has('key0')).toBe(false);
        expect(items[0]!.dispose).toHaveBeenCalled();

        cache.set('key2', items[2]!);
        expect(cache.size).toBe(1);
        expect(cache.has('key1')).toBe(false);

        cache.clear();
    });

    it('should handle empty string key', () => {
        const cache = new LRUTextureCache({ maxSize: 5, maxMemory: 0 });
        const item = createMockDisposable();

        cache.set('', item);

        expect(cache.has('')).toBe(true);
        expect(cache.get('')).toBe(item);

        cache.clear();
    });

    it('should handle special characters in key', () => {
        const cache = new LRUTextureCache({ maxSize: 5, maxMemory: 0 });
        const item = createMockDisposable();
        const specialKey = 'pattern-/\\*?:"<>|한글';

        cache.set(specialKey, item);

        expect(cache.has(specialKey)).toBe(true);
        expect(cache.get(specialKey)).toBe(item);

        cache.clear();
    });

    it('should handle zero memory size', () => {
        const cache = new LRUTextureCache({ maxSize: 5, maxMemory: 1000 });
        const item = createMockDisposable();

        cache.set('key1', item, 0);

        expect(cache.getStats().memoryUsage).toBe(0);

        cache.clear();
    });

    it('should handle get on head item without modification', () => {
        const cache = new LRUTextureCache({ maxSize: 3, maxMemory: 0 });
        const items = createMockDisposables(3);

        cache.set('key0', items[0]!);
        cache.set('key1', items[1]!);
        cache.set('key2', items[2]!); // key2 is MRU (head)

        // key2 조회 (이미 head)
        const result = cache.get('key2');

        expect(result).toBe(items[2]);

        cache.clear();
    });

    it('should handle rapid set/get operations', () => {
        const cache = new LRUTextureCache({ maxSize: 100, maxMemory: 0 });

        for (let i = 0; i < 1000; i++) {
            cache.set(`key${i % 100}`, createMockDisposable(`item-${i}`));
            cache.get(`key${(i + 50) % 100}`);
        }

        expect(cache.size).toBeLessThanOrEqual(100);

        cache.clear();
    });
});

// ============================================================
// Singleton Pattern Tests
// ============================================================

describe('Singleton Pattern', () => {
    afterEach(() => {
        resetPatternTextureCache();
    });

    describe('getPatternTextureCache', () => {
        it('should return same instance on multiple calls', () => {
            const cache1 = getPatternTextureCache();
            const cache2 = getPatternTextureCache();

            expect(cache1).toBe(cache2);
        });

        it('should apply config only on first call', () => {
            const cache1 = getPatternTextureCache({ maxSize: 50 });
            const cache2 = getPatternTextureCache({ maxSize: 200 }); // ignored

            expect(cache1).toBe(cache2);
            expect(cache1.getStats().maxSize).toBe(50);
        });

        it('should use default config when not provided', () => {
            const cache = getPatternTextureCache();

            expect(cache.getStats().maxSize).toBe(
                DEFAULT_TEXTURE_CACHE_CONFIG.maxSize
            );
        });
    });

    describe('resetPatternTextureCache', () => {
        it('should clear and reset singleton', () => {
            const cache1 = getPatternTextureCache({ maxSize: 50 });

            // Mock item을 실제 dispose 가능한 객체로 생성
            const mockTexture = { dispose: vi.fn() };
            (cache1 as unknown as LRUTextureCache<typeof mockTexture>).set(
                'test',
                mockTexture
            );

            resetPatternTextureCache();

            expect(mockTexture.dispose).toHaveBeenCalled();

            const cache2 = getPatternTextureCache({ maxSize: 75 });
            expect(cache2).not.toBe(cache1);
            expect(cache2.getStats().maxSize).toBe(75);
        });

        it('should handle reset when no instance exists', () => {
            // 인스턴스 없이 reset 호출 - 에러 없어야 함
            expect(() => resetPatternTextureCache()).not.toThrow();
        });

        it('should handle multiple resets', () => {
            getPatternTextureCache();
            resetPatternTextureCache();
            resetPatternTextureCache(); // 두 번째 reset
            resetPatternTextureCache(); // 세 번째 reset

            // 에러 없이 완료되어야 함
            expect(true).toBe(true);
        });
    });
});

// ============================================================
// Memory Management Tests
// ============================================================

describe('Memory Management', () => {
    it('should dispose items correctly on eviction', () => {
        const cache = new LRUTextureCache({ maxSize: 2, maxMemory: 0 });
        const items = createMockDisposables(5);

        cache.set('key0', items[0]!);
        cache.set('key1', items[1]!);
        cache.set('key2', items[2]!); // key0 evicted

        expect(items[0]!.dispose).toHaveBeenCalledTimes(1);
        expect(items[1]!.dispose).not.toHaveBeenCalled();
        expect(items[2]!.dispose).not.toHaveBeenCalled();

        cache.clear();
    });

    it('should dispose items correctly on update', () => {
        const cache = new LRUTextureCache({ maxSize: 5, maxMemory: 0 });
        const oldItem = createMockDisposable('old');
        const newItem = createMockDisposable('new');

        cache.set('key1', oldItem);
        cache.set('key1', newItem); // update

        expect(oldItem.dispose).toHaveBeenCalledTimes(1);
        expect(newItem.dispose).not.toHaveBeenCalled();

        cache.clear();
    });

    it('should dispose items correctly on delete', () => {
        const cache = new LRUTextureCache({ maxSize: 5, maxMemory: 0 });
        const item = createMockDisposable();

        cache.set('key1', item);
        cache.delete('key1');

        expect(item.dispose).toHaveBeenCalledTimes(1);
    });

    it('should dispose all items on clear', () => {
        const cache = new LRUTextureCache({ maxSize: 10, maxMemory: 0 });
        const items = createMockDisposables(5);

        items.forEach((item, i) => cache.set(`key${i}`, item));
        cache.clear();

        items.forEach((item) => {
            expect(item.dispose).toHaveBeenCalledTimes(1);
        });
    });

    it('should not leak memory with create-dispose cycles', () => {
        const cache = new LRUTextureCache({ maxSize: 3, maxMemory: 0 });

        for (let cycle = 0; cycle < 10; cycle++) {
            const items = createMockDisposables(5);
            items.forEach((item, i) => cache.set(`key${i}`, item));
        }

        // 최종 크기는 maxSize 이하
        expect(cache.size).toBeLessThanOrEqual(3);

        cache.clear();
    });
});

// ============================================================
// Performance Tests
// ============================================================

describe('Performance', () => {
    it('should handle large number of items efficiently', () => {
        const cache = new LRUTextureCache({ maxSize: 1000, maxMemory: 0 });

        const start = performance.now();

        // 5000개 항목 추가 (eviction 발생)
        for (let i = 0; i < 5000; i++) {
            cache.set(`key${i}`, createMockDisposable(`item-${i}`));
        }

        const setTime = performance.now() - start;

        // 5000개 조회
        const getStart = performance.now();
        for (let i = 4000; i < 5000; i++) {
            cache.get(`key${i}`);
        }
        const getTime = performance.now() - getStart;

        // 합리적인 시간 내 완료 (2초 이내)
        expect(setTime).toBeLessThan(2000);
        expect(getTime).toBeLessThan(500);

        cache.clear();
    });

    it('should maintain O(1) get/set performance', () => {
        const cache = new LRUTextureCache({ maxSize: 10000, maxMemory: 0 });

        // 캐시 채우기
        for (let i = 0; i < 10000; i++) {
            cache.set(`key${i}`, createMockDisposable());
        }

        // 단일 연산 시간 측정
        const iterations = 1000;

        const getStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            cache.get(`key${i % 10000}`);
        }
        const avgGetTime = (performance.now() - getStart) / iterations;

        const setStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            cache.set(`key${i % 10000}`, createMockDisposable());
        }
        const avgSetTime = (performance.now() - setStart) / iterations;

        // 평균 연산 시간이 1ms 미만이어야 함
        expect(avgGetTime).toBeLessThan(1);
        expect(avgSetTime).toBeLessThan(1);

        cache.clear();
    });
});
