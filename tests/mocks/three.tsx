/**
 * Three.js & React Three Fiber Mocks
 * R3F 컴포넌트 테스트를 위한 모킹 유틸리티
 *
 * jsdom 환경에서는 WebGL이 지원되지 않아 Three.js 렌더링이 불가능합니다.
 * 이 파일의 모킹 함수를 사용하여 컴포넌트 렌더링 테스트를 수행할 수 있습니다.
 */

import type { ReactNode } from 'react';

import { vi } from 'vitest';

/**
 * React Three Fiber 모킹 설정
 * Canvas와 주요 훅들을 모킹하여 컴포넌트 테스트 가능하게 함
 *
 * @example
 * ```tsx
 * import { setupR3FMocks } from '@tests/mocks/three';
 * import { render, screen } from '@testing-library/react';
 * import { CADScene } from '../CADScene';
 *
 * setupR3FMocks();
 *
 * it('CADScene renders', () => {
 *     render(<CADScene />);
 *     expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
 * });
 * ```
 */
export function setupR3FMocks() {
    // @react-three/fiber 모킹
    vi.mock('@react-three/fiber', () => ({
        Canvas: ({ children }: { children: ReactNode }) => (
            <div data-testid="r3f-canvas">{children}</div>
        ),
        useFrame: vi.fn(),
        useThree: vi.fn(() => ({
            camera: {
                position: { x: 0, y: 0, z: 200 },
                lookAt: vi.fn(),
                updateProjectionMatrix: vi.fn(),
            },
            scene: {
                add: vi.fn(),
                remove: vi.fn(),
            },
            gl: {
                domElement: document.createElement('canvas'),
                render: vi.fn(),
                setSize: vi.fn(),
            },
            size: { width: 800, height: 600 },
            viewport: { width: 800, height: 600 },
            set: vi.fn(),
            get: vi.fn(),
            invalidate: vi.fn(),
        })),
        useLoader: vi.fn(),
        extend: vi.fn(),
    }));

    // @react-three/drei 모킹
    vi.mock('@react-three/drei', () => ({
        OrbitControls: () => null,
        PerspectiveCamera: () => null,
        Html: ({ children }: { children: ReactNode }) => (
            <div data-testid="drei-html">{children}</div>
        ),
        Text: ({ children }: { children: ReactNode }) => (
            <span data-testid="drei-text">{children}</span>
        ),
        Line: () => null,
        Plane: () => null,
        Box: () => null,
        Sphere: () => null,
        useTexture: vi.fn(() => null),
        useGLTF: vi.fn(() => ({ scene: {}, nodes: {}, materials: {} })),
    }));
}

/**
 * Three.js 코어 모킹
 * 순수 Three.js 객체들을 모킹할 때 사용
 *
 * @example
 * ```tsx
 * import { mockThreeCore } from '@tests/mocks/three';
 *
 * beforeAll(() => {
 *     mockThreeCore();
 * });
 * ```
 */
export function mockThreeCore() {
    vi.mock('three', () => ({
        // Geometry
        BufferGeometry: vi.fn().mockImplementation(() => ({
            setAttribute: vi.fn(),
            setIndex: vi.fn(),
            computeBoundingBox: vi.fn(),
            computeBoundingSphere: vi.fn(),
            dispose: vi.fn(),
            boundingBox: {
                min: { x: 0, y: 0, z: 0 },
                max: { x: 100, y: 100, z: 0 },
            },
        })),
        Float32BufferAttribute: vi.fn().mockImplementation((array) => ({
            array,
            count: array.length / 3,
        })),

        // Materials
        LineBasicMaterial: vi.fn().mockImplementation(() => ({
            color: { set: vi.fn() },
            dispose: vi.fn(),
        })),
        MeshBasicMaterial: vi.fn().mockImplementation(() => ({
            color: { set: vi.fn() },
            dispose: vi.fn(),
        })),

        // Objects
        Line: vi.fn().mockImplementation(() => ({
            geometry: {},
            material: {},
            position: { set: vi.fn() },
            rotation: { set: vi.fn() },
        })),
        LineSegments: vi.fn().mockImplementation(() => ({
            geometry: {},
            material: {},
            position: { set: vi.fn() },
        })),
        Group: vi.fn().mockImplementation(() => ({
            add: vi.fn(),
            remove: vi.fn(),
            children: [],
        })),

        // Math
        Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
            x,
            y,
            z,
            set: vi.fn(),
            add: vi.fn().mockReturnThis(),
            sub: vi.fn().mockReturnThis(),
            multiplyScalar: vi.fn().mockReturnThis(),
            clone: vi.fn().mockReturnThis(),
        })),
        Color: vi.fn().mockImplementation(() => ({
            r: 0,
            g: 0,
            b: 0,
            set: vi.fn(),
            setHex: vi.fn(),
        })),
        Box3: vi.fn().mockImplementation(() => ({
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 },
            setFromObject: vi.fn(),
            getCenter: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
            getSize: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
        })),

        // Constants
        DoubleSide: 2,
        FrontSide: 0,
        BackSide: 1,
    }));
}

/**
 * 모든 Three.js 관련 모킹을 한 번에 설정
 */
export function setupAllThreeMocks() {
    setupR3FMocks();
    mockThreeCore();
}

/**
 * 모킹 초기화 (테스트 후 정리용)
 */
export function clearThreeMocks() {
    vi.clearAllMocks();
}
