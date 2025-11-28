import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { type ReactNode } from 'react';
import THREE_CONFIG from '../config';

interface SceneProps {
    children?: ReactNode;
    className?: string;
}

export function Scene({ children, className = '' }: SceneProps) {
    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas>
                <PerspectiveCamera
                    makeDefault
                    fov={THREE_CONFIG.camera.fov}
                    near={THREE_CONFIG.camera.near}
                    far={THREE_CONFIG.camera.far}
                    position={THREE_CONFIG.camera.position}
                />

                <ambientLight intensity={THREE_CONFIG.lights.ambient.intensity} />
                <directionalLight
                    position={THREE_CONFIG.lights.directional.position}
                    intensity={THREE_CONFIG.lights.directional.intensity}
                />

                {children}

                <OrbitControls />
            </Canvas>
        </div>
    );
}
