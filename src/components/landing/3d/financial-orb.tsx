'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CoinModel } from './CoinModel';
import { useTheme } from 'next-themes';

const CoinStack = () => {
  // Keep coins stationary at center - camera orbits around this point
  return (
    <group position={[0, 0, 0]}>
      <CoinModel scale={1.2} />
    </group>
  );
};

export const FinancialOrb = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Canvas
      camera={{
        position: [25, 10, 30],
        fov: 20,
        near: 0.1,
        far: 1000
      }}
      shadows
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={isDark ? 0.4 : 0.8} />
      <spotLight
        position={[15, 15, 20]}
        penumbra={1}
        angle={0.3}
        color={isDark ? '#f9c74f' : '#f9c74f'}
        castShadow
        intensity={isDark ? 100 : 150}
        shadow-mapSize={1024}
      />
      <directionalLight
        position={[-8, 8, 5]}
        intensity={isDark ? 1 : 1.5}
        color={isDark ? '#ffffff' : '#ffffff'}
      />
      <pointLight
        position={[5, -5, 10]}
        intensity={isDark ? 40 : 80}
        color={isDark ? '#6366f1' : '#4f9cf9'}
      />

      <Environment preset='city' />

      <Suspense fallback={null}>
        <CoinStack />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false} // Disable mouse interaction
        autoRotate
        autoRotateSpeed={1.2} // Increased speed for cooler effect
        minPolarAngle={Math.PI * 0.35}
        maxPolarAngle={Math.PI * 0.65}
        target={[0, 0, 0]} // Camera focuses on coin center
      />
    </Canvas>
  );
};
