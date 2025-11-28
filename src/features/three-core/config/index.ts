/**
 * Three.js Configuration
 */

export const THREE_CONFIG = {
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: [0, 0, 5] as [number, number, number],
    },
    renderer: {
        antialias: true,
        alpha: true,
    },
    lights: {
        ambient: {
            intensity: 0.5,
        },
        directional: {
            intensity: 1,
            position: [10, 10, 5] as [number, number, number],
        },
    },
} as const;

export default THREE_CONFIG;
