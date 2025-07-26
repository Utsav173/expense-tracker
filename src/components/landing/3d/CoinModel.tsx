import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

export function CoinModel(props: React.ComponentProps<'group'>) {
  const { scene } = useGLTF('/coin_model/scene-transformed.glb');

  return (
    <group {...props} dispose={null}>
      <primitive object={scene.clone()} />
    </group>
  );
}

useGLTF.preload('/coin_model/scene-transformed.glb');
