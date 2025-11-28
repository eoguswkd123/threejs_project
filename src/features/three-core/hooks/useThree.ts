import { useThree as useThreeBase } from '@react-three/fiber';

/**
 * Custom hook for accessing Three.js context
 */
export function useThree() {
    const context = useThreeBase();

    return {
        camera: context.camera,
        scene: context.scene,
        gl: context.gl,
        size: context.size,
        viewport: context.viewport,
    };
}
