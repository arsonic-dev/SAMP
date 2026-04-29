import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null)

  const count = 2000
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.03
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00D4FF"
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function GridPlane() {
  return (
    <gridHelper
      args={[40, 40, '#00D4FF', '#0D1526']}
      position={[0, -5, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

export function ParticleBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: false }}
      >
        <ambientLight intensity={0.1} />
        <ParticleField />
        <GridPlane />
      </Canvas>
    </div>
  )
}
