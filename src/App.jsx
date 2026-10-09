import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function rgbToHex([r, g, b]) {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

function colorDistance(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
      (a[1] - b[1]) ** 2 +
      (a[2] - b[2]) ** 2,
  )
}

function buildMapBlocks(imageSrc, selectedColor, tolerance, heightScale, sampleStep) {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve([])
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const targetWidth = 220
      const scale = Math.min(1, targetWidth / img.width)
      const width = Math.max(1, Math.floor(img.width * scale))
      const height = Math.max(1, Math.floor(img.height * scale))

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const { data } = ctx.getImageData(0, 0, width, height)
      const blocks = []

      for (let y = 0; y < height; y += sampleStep) {
        for (let x = 0; x < width; x += sampleStep) {
          const index = (y * width + x) * 4
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]
          const a = data[index + 3]

          if (a < 10) continue

          const pixelColor = [r, g, b]
          const distance = colorDistance(pixelColor, selectedColor)

          if (distance <= tolerance) {
            const worldX = (x - width / 2) * 0.75
            const worldZ = -(y - height / 2) * 0.75
            const blockHeight = 0.6 + Math.min(10, (tolerance - distance + 12) / 10) * heightScale

            blocks.push({
              x: worldX,
              y: 0,
              z: worldZ,
              height: blockHeight,
            })
          }
        }
      }

      resolve(blocks)
    }

    img.src = imageSrc
  })
}

function Blocks({ blocks, color }) {
  return (
    <group>
      {blocks.map((block, index) => (
        <mesh
          key={`${block.x}-${block.z}-${index}`}
          position={[block.x, block.height / 2, block.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.7, block.height, 0.7]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            metalness={0.35}
            roughness={0.28}
          />
        </mesh>
      ))}
    </group>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[400, 400, 1, 1]} />
      <meshStandardMaterial color="#0b1120" metalness={0.2} roughness={0.95} />
    </mesh>
  )
}

function HologramScene({ imageSrc, selectedColor, tolerance, heightScale, autoRotate }) {
  const [blocks, setBlocks] = useState([])
  const controlsRef = useRef(null)

  useEffect(() => {
    let active = true

    buildMapBlocks(imageSrc, selectedColor, tolerance, heightScale, 2).then((newBlocks) => {
      if (active) setBlocks(newBlocks)
    })

    return () => {
      active = false
    }
  }, [imageSrc, selectedColor, tolerance, heightScale])

  useEffect(() => {
    if (!controlsRef.current) return
    controlsRef.current.autoRotate = autoRotate
  }, [autoRotate])

  return (
    <>
      <ambientLight intensity={1.2} />
      <hemisphereLight args={['#dbeafe', '#020817', 1.2]} />
      <directionalLight position={[40, 50, 20]} intensity={1.6} castShadow />
      <spotLight position={[0, 40, 0]} angle={0.5} penumbra={0.7} intensity={0.9} color="#67e8f9" />

      <Floor />

      {blocks.length > 0 && (
        <Blocks
          blocks={blocks}
          color={rgbToHex(selectedColor)}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
        minDistance={20}
        maxDistance={260}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  )
}

export default function App() {
  const [imageSrc, setImageSrc] = useState('')
  const [selectedColor, setSelectedColor] = useState([209, 226, 255])
  const [tolerance, setTolerance] = useState(32)
  const [heightScale, setHeightScale] = useState(10)
  const [autoRotate, setAutoRotate] = useState(true)

  const colorHex = useMemo(() => rgbToHex(selectedColor), [selectedColor])

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setImageSrc(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="app-shell">
      <div className="panel">
        <h1>Holographic Map 3D</h1>

        <label className="upload-label">
          <span>Load map image</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
        </label>

        <div className="control-group">
          <label htmlFor="color-picker">Target color</label>
          <input
            id="color-picker"
            type="color"
            value={colorHex}
            onChange={(event) => {
              const hex = event.target.value
              const r = Number.parseInt(hex.slice(1, 3), 16)
              const g = Number.parseInt(hex.slice(3, 5), 16)
              const b = Number.parseInt(hex.slice(5, 7), 16)
              setSelectedColor([r, g, b])
            }}
          />
        </div>

        <div className="control-group">
          <label htmlFor="tolerance-slider">Color tolerance: {tolerance}</label>
          <input
            id="tolerance-slider"
            type="range"
            min="0"
            max="120"
            value={tolerance}
            onChange={(event) => setTolerance(Number(event.target.value))}
          />
        </div>

        <div className="control-group">
          <label htmlFor="height-slider">Height scale: {heightScale}</label>
          <input
            id="height-slider"
            type="range"
            min="2"
            max="30"
            value={heightScale}
            onChange={(event) => setHeightScale(Number(event.target.value))}
          />
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(event) => setAutoRotate(event.target.checked)}
          />
          Auto rotate
        </label>
      </div>

      <div className="canvas-wrap">
        <Canvas
          shadows
          camera={{ position: [0, 70, 110], fov: 40 }}
        >
          <HologramScene
            imageSrc={imageSrc}
            selectedColor={selectedColor}
            tolerance={tolerance}
            heightScale={heightScale}
            autoRotate={autoRotate}
          />
        </Canvas>
      </div>
    </div>
  )
}
