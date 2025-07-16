import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// TypeScript interfaces
interface SceneObject {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationVelocity: THREE.Vector3;
  type: 'cube' | 'sphere' | 'torus' | 'cone';
  originalPosition: THREE.Vector3;
}

interface SceneConfig {
  rotationSpeed: number;
  objectCount: number;
  animationSpeed: number;
  wireframe: boolean;
  autoRotate: boolean;
}

interface Stats {
  fps: number;
  frameCount: number;
  lastTime: number;
  objects: number;
  triangles: number;
}

const Scene3DShowcase: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsRef = useRef<SceneObject[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const [config, setConfig] = useState<SceneConfig>({
    rotationSpeed: 1,
    objectCount: 8,
    animationSpeed: 1,
    wireframe: false,
    autoRotate: true
  });

  const [stats, setStats] = useState<Stats>({
    fps: 0,
    frameCount: 0,
    lastTime: Date.now(),
    objects: 0,
    triangles: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(true);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    // Always use the full window size for canvas
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Prevent duplicate renderer
    if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      return;
    }

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 8, 22); // Move camera further back and higher
      camera.lookAt(0, 0, 0);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      // Make canvas fill parent
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.width = "100vw";
      renderer.domElement.style.height = "100vh";

      if (!mountRef.current.contains(renderer.domElement)) {
        mountRef.current.appendChild(renderer.domElement);
      }

      // Lighting setup
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      const pointLight1 = new THREE.PointLight(0xff6b6b, 1, 100);
      pointLight1.position.set(10, 10, 10);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x4ecdc4, 1, 100);
      pointLight2.position.set(-10, -10, -10);
      scene.add(pointLight2);

      // Ground plane
      const groundGeometry = new THREE.PlaneGeometry(50, 50);
      const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x16213e,
        transparent: true,
        opacity: 0.8
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -5;
      ground.receiveShadow = true;
      scene.add(ground);

      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;

      // Add mouse interaction
      const onMouseMove = (event: MouseEvent) => {
        mouseRef.current.x = (event.clientX / width) * 2 - 1;
        mouseRef.current.y = -(event.clientY / height) * 2 + 1;
      };

      mountRef.current.addEventListener('mousemove', onMouseMove);

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setStats(prev => ({ ...prev, fps: 0, objects: 0, triangles: 0 }));
    }
  }, []);

  // Create 3D objects
  const createObjects = useCallback(() => {
    if (!sceneRef.current) return;

    // Clear existing objects
    objectsRef.current.forEach(obj => {
      sceneRef.current!.remove(obj.mesh);
    });
    objectsRef.current = [];

    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.7, 32, 32),
      new THREE.TorusGeometry(0.7, 0.3, 16, 100),
      new THREE.ConeGeometry(0.7, 1.5, 32)
    ];

    const materials = [
      new THREE.MeshPhongMaterial({ color: 0xff6b6b }),
      new THREE.MeshPhongMaterial({ color: 0x4ecdc4 }),
      new THREE.MeshPhongMaterial({ color: 0x45b7d1 }),
      new THREE.MeshPhongMaterial({ color: 0xf9ca24 }),
      new THREE.MeshPhongMaterial({ color: 0x6c5ce7 }),
      new THREE.MeshPhongMaterial({ color: 0xa29bfe }),
      new THREE.MeshPhongMaterial({ color: 0xfd79a8 }),
      new THREE.MeshPhongMaterial({ color: 0x00b894 })
    ];

    const types: ('cube' | 'sphere' | 'torus' | 'cone')[] = ['cube', 'sphere', 'torus', 'cone'];

    // Increase radius so objects are visible
    const radius = 8;

    for (let i = 0; i < config.objectCount; i++) {
      const geometryIndex = Math.floor(Math.random() * geometries.length);
      const materialIndex = Math.floor(Math.random() * materials.length);
      const material = materials[materialIndex].clone();
      material.wireframe = config.wireframe;

      const mesh = new THREE.Mesh(geometries[geometryIndex], material);

      // Position objects in a circle, centered at y=0
      const angle = (i / config.objectCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.random() * 2 - 1; // Keep y closer to center

      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );

      const rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05
      );

      const sceneObject: SceneObject = {
        mesh,
        velocity,
        rotationVelocity,
        type: types[geometryIndex],
        originalPosition: mesh.position.clone()
      };

      objectsRef.current.push(sceneObject);
      sceneRef.current.add(mesh);
    }

    // Update stats
    setStats(prev => ({ ...prev, objects: config.objectCount }));
  }, [config.objectCount, config.wireframe]);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const deltaTime = clockRef.current.getDelta();
    const elapsedTime = clockRef.current.elapsedTime;
    
    // Update objects
    objectsRef.current.forEach((obj, index) => {
      // Rotation
      obj.mesh.rotation.x += obj.rotationVelocity.x * config.rotationSpeed * config.animationSpeed;
      obj.mesh.rotation.y += obj.rotationVelocity.y * config.rotationSpeed * config.animationSpeed;
      obj.mesh.rotation.z += obj.rotationVelocity.z * config.rotationSpeed * config.animationSpeed;

      // Floating animation
      obj.mesh.position.y = obj.originalPosition.y + Math.sin(elapsedTime * 2 + index) * 0.5;

      // Orbital motion
      if (config.autoRotate) {
        const angle = elapsedTime * 0.5 * config.animationSpeed + (index / config.objectCount) * Math.PI * 2;
        const radius = 8;
        obj.mesh.position.x = Math.cos(angle) * radius;
        obj.mesh.position.z = Math.sin(angle) * radius;
        console.log(deltaTime)
      }

      // Color animation
      const hue = (elapsedTime * 0.1 + index * 0.1) % 1;
      (obj.mesh.material as THREE.MeshPhongMaterial).color.setHSL(hue, 0.7, 0.6);
    });

    // Camera movement based on mouse
    if (config.autoRotate) {
      cameraRef.current.position.x += (mouseRef.current.x * 5 - cameraRef.current.position.x) * 0.02;
      cameraRef.current.position.y += (mouseRef.current.y * 5 - cameraRef.current.position.y) * 0.02;
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Update FPS
    setStats(prev => {
      const now = Date.now();
      const newFrameCount = prev.frameCount + 1;
      const fps = now - prev.lastTime > 1000 ? 
        Math.round(newFrameCount * 1000 / (now - prev.lastTime)) : prev.fps;
      
      return {
        ...prev,
        fps: now - prev.lastTime > 1000 ? fps : prev.fps,
        frameCount: now - prev.lastTime > 1000 ? 0 : newFrameCount,
        lastTime: now - prev.lastTime > 1000 ? now : prev.lastTime,
        triangles: objectsRef.current.reduce((acc, obj) => acc + obj.mesh.geometry.attributes.position.count / 3, 0)
      };
    });

    animationIdRef.current = requestAnimationFrame(animate);
  }, [config]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

    // Always use full window size
    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);

    // Make canvas fill parent
    rendererRef.current.domElement.style.width = "100vw";
    rendererRef.current.domElement.style.height = "100vh";
  }, []);

  // Control handlers
  const handleConfigChange = (key: keyof SceneConfig, value: number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 5, 15);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const randomizeColors = () => {
    objectsRef.current.forEach(obj => {
      (obj.mesh.material as THREE.MeshPhongMaterial).color.setHSL(
        Math.random(),
        0.7,
        0.6
      );
    });
  };

  // Effects
  useEffect(() => {
    initScene();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      // Only remove renderer if it exists
      if (rendererRef.current && mountRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      objectsRef.current = [];
    };
  }, [initScene, handleResize]);

  useEffect(() => {
    if (!isLoading) {
      createObjects();
    }
  }, [createObjects, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      animate();
    }
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [animate, isLoading]);

  useEffect(() => {
    objectsRef.current.forEach(obj => {
      (obj.mesh.material as THREE.MeshPhongMaterial).wireframe = config.wireframe;
    });
  }, [config.wireframe]);

  return (
    <div
      className="fixed inset-0 w-full h-full"
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", overflow: "hidden" }}
    >
      {/* Canvas mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-xl font-semibold">Loading 3D Scene...</div>
        </div>
      )}

      {/* Controls Toggle Button (visible on mobile and desktop) */}
      <button
        className="absolute top-4 left-4 z-20 bg-black bg-opacity-60 text-white rounded-full p-2 shadow-lg focus:outline-none md:hidden"
        style={{ minWidth: 40, minHeight: 40 }}
        aria-label={controlsOpen ? "Hide Controls" : "Show Controls"}
        onClick={() => setControlsOpen((open) => !open)}
      >
        {controlsOpen ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 8h16M4 16h16" />
          </svg>
        )}
      </button>

      {/* Controls Panel */}
      <div
        className={`absolute top-4 left-4 bg-black bg-opacity-20 backdrop-blur-lg rounded-xl p-6 text-white min-w-80 z-10 transition-all duration-300
          ${controlsOpen ? "block" : "hidden"} md:block`}
        style={{
          maxWidth: "90vw",
          width: "320px",
          boxSizing: "border-box",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-center flex-1">3D Scene Controls</h3>
          {/* Desktop close button */}
          <button
            className="md:hidden ml-2 bg-black bg-opacity-40 rounded-full p-1"
            aria-label="Close Controls"
            onClick={() => setControlsOpen(false)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 14L14 6M6 6l8 8" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rotation Speed: {config.rotationSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={config.rotationSpeed}
              onChange={(e) => handleConfigChange('rotationSpeed', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Object Count: {config.objectCount}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={config.objectCount}
              onChange={(e) => handleConfigChange('objectCount', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Animation Speed: {config.animationSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={config.animationSpeed}
              onChange={(e) => handleConfigChange('animationSpeed', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleConfigChange('wireframe', !config.wireframe)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                config.wireframe 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {config.wireframe ? 'Solid' : 'Wireframe'}
            </button>
            <button
              onClick={() => handleConfigChange('autoRotate', !config.autoRotate)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                config.autoRotate 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {config.autoRotate ? 'Stop Orbit' : 'Auto Orbit'}
            </button>
            <button
              onClick={randomizeColors}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Random Colors
            </button>
            <button
              onClick={resetCamera}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Reset Camera
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Panel */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 rounded-xl p-4 text-white font-mono text-sm z-10">
        <div className="space-y-1">
          <div>FPS: <span className="text-green-400">{stats.fps}</span></div>
          <div>Objects: <span className="text-blue-400">{stats.objects}</span></div>
          <div>Triangles: <span className="text-yellow-400">{Math.round(stats.triangles)}</span></div>
        </div>
      </div>
      
      {/* Project Info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-20 backdrop-blur-lg rounded-xl p-4 text-white max-w-md z-10">
        <h4 className="font-bold text-lg mb-2">3D React TypeScript Showcase</h4>
        <p className="text-sm opacity-90">
          Interactive 3D scene built with React, TypeScript, and Three.js. 
          Features real-time rendering, dynamic lighting, and responsive controls.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-600 rounded text-xs">React</span>
          <span className="px-2 py-1 bg-blue-500 rounded text-xs">TypeScript</span>
          <span className="px-2 py-1 bg-green-600 rounded text-xs">Three.js</span>
          <span className="px-2 py-1 bg-purple-600 rounded text-xs">WebGL</span>
        </div>
      </div>
    </div>
  );
};

export default Scene3DShowcase;