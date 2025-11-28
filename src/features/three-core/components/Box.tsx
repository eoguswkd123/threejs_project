import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface BoxProps {
    position?: [number, number, number];
    color?: string;
}

export function Box({ position = [0, 0, 0], color = '#ff6b6b' }: BoxProps) {
    const meshRef = useRef<Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.5;
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            scale={active ? 1.5 : 1}
            onClick={() => setActive(!active)}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? '#4ecdc4' : color} />
        </mesh>
    );
}
