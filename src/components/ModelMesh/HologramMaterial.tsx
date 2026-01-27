/**
 * HologramMaterial - Custom Shader Material
 *
 * Iron Man 스타일 홀로그램 머티리얼
 * Based on Anderson Mancini's threejs-holographic-material
 * @see https://github.com/ektogamat/threejs-holographic-material
 */

import { useRef, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { HologramSettings } from './types';

// Shader sources (inline for Vite compatibility)
const hologramVertexShader = /* glsl */ `
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const hologramFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uFresnelAmount;
uniform float uFresnelOpacity;
uniform float uHologramBrightness;
uniform float uScanlineSize;
uniform float uSignalSpeed;
uniform vec3 uHologramColor;
uniform float uHologramOpacity;
uniform float uEnableBlinking;
uniform float uBlinkFresnelOnly;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Fresnel effect (edge glow)
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);
    fresnel = fresnel * uFresnelAmount + uFresnelOpacity;

    // Scanline effect
    float scanline = sin(vWorldPosition.y * uScanlineSize + uTime * uSignalSpeed);
    scanline = scanline * 0.5 + 0.5;
    scanline = pow(scanline, 1.5);

    // Blink/glitch effect
    float blink = 1.0;
    if (uEnableBlinking > 0.5) {
        float blinkSpeed = uTime * 3.0;
        float blinkNoise = random(vec2(floor(blinkSpeed), 0.0));
        blink = step(0.97, blinkNoise) * 0.3 + 0.7;

        if (uBlinkFresnelOnly > 0.5) {
            blink = mix(1.0, blink, fresnel);
        }
    }

    // Vertical scan wave
    float verticalScan = sin(vWorldPosition.y * 2.0 - uTime * 1.5);
    verticalScan = smoothstep(-0.5, 0.5, verticalScan) * 0.3 + 0.7;

    // Final color
    vec3 hologramColor = uHologramColor * uHologramBrightness;

    // Combine effects
    float alpha = max(fresnel, 0.1) * scanline * blink * verticalScan;
    alpha = clamp(alpha * uHologramOpacity, 0.0, 1.0);

    // Edge glow enhancement
    float edgeGlow = fresnel * 1.5;
    hologramColor += uHologramColor * edgeGlow * 0.5;

    gl_FragColor = vec4(hologramColor, alpha);
}
`;

interface HologramMaterialProps extends Partial<HologramSettings> {
    /** 면 렌더링 방향 */
    side?: 'FrontSide' | 'BackSide' | 'DoubleSide';
}

/**
 * 홀로그램 셰이더 머티리얼 컴포넌트
 *
 * @example
 * <mesh>
 *   <boxGeometry />
 *   <HologramMaterial hologramColor="#00ffff" />
 * </mesh>
 */
export function HologramMaterial({
    fresnelAmount = 0.2,
    fresnelOpacity = 0.15,
    hologramBrightness = 0.7,
    scanlineSize = 6,
    signalSpeed = 2.3,
    hologramColor = '#00ffff',
    hologramOpacity = 1.0,
    enableBlinking = true,
    blinkFresnelOnly = true,
    enableAdditive = true,
    side = 'FrontSide',
}: HologramMaterialProps) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uFresnelAmount: { value: fresnelAmount },
            uFresnelOpacity: { value: fresnelOpacity },
            uHologramBrightness: { value: hologramBrightness },
            uScanlineSize: { value: scanlineSize },
            uSignalSpeed: { value: signalSpeed },
            uHologramColor: { value: new THREE.Color(hologramColor) },
            uHologramOpacity: { value: hologramOpacity },
            uEnableBlinking: { value: enableBlinking ? 1.0 : 0.0 },
            uBlinkFresnelOnly: { value: blinkFresnelOnly ? 1.0 : 0.0 },
        }),
        [
            fresnelAmount,
            fresnelOpacity,
            hologramBrightness,
            scanlineSize,
            signalSpeed,
            hologramColor,
            hologramOpacity,
            enableBlinking,
            blinkFresnelOnly,
        ]
    );

    // 시간 uniform 애니메이션
    useFrame((state) => {
        if (materialRef.current?.uniforms?.uTime) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const sideValue = useMemo(() => {
        switch (side) {
            case 'BackSide':
                return THREE.BackSide;
            case 'DoubleSide':
                return THREE.DoubleSide;
            default:
                return THREE.FrontSide;
        }
    }, [side]);

    return (
        <shaderMaterial
            ref={materialRef}
            vertexShader={hologramVertexShader}
            fragmentShader={hologramFragmentShader}
            uniforms={uniforms}
            transparent={true}
            depthWrite={false}
            blending={
                enableAdditive ? THREE.AdditiveBlending : THREE.NormalBlending
            }
            side={sideValue}
        />
    );
}

export default HologramMaterial;
