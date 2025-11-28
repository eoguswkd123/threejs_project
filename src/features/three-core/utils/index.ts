/**
 * Three.js utility functions
 */

export function degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, alpha: number): number {
    return start + (end - start) * alpha;
}
