import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// --- IMPORTANT: THESE SHADER DEFINITIONS MUST BE HERE AT THE TOP ---
const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D u_texture;    
    uniform vec2 u_mouse;
    uniform vec2 u_prevMouse;
    uniform float u_aberrationIntensity;

    void main() {
        vec2 gridUV = floor(vUv * vec2(20.0, 20.0)) / vec2(20.0, 20.0);
        vec2 centerOfPixel = gridUV + vec2(1.0/20.0, 1.0/20.0);
        
        vec2 mouseDirection = u_mouse - u_prevMouse;
        
        vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
        float pixelDistanceToMouse = length(pixelToMouseDirection);
        float strength = smoothstep(0.3, 0.0, pixelDistanceToMouse);
 
        vec2 uvOffset = strength * - mouseDirection * 0.2;
        vec2 uv = vUv - uvOffset;

        vec4 colorR = texture2D(u_texture, uv + vec2(strength * u_aberrationIntensity * 0.01, 0.0));
        vec4 colorG = texture2D(u_texture, uv);
        vec4 colorB = texture2D(u_texture, uv - vec2(strength * u_aberrationIntensity * 0.01, 0.0));

        gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
    }
`;
// --- END OF SHADER DEFINITIONS ---

export const useImageDistortion = (imageUrl) => {
  const imageContainerRef = useRef(null);
  const imageElementRef = useRef(null);
  const isInitializedRef = useRef(false); // Use a ref for initialization flag
  const animationFrameId = useRef(null); 

  // THREE.js state variables
  const scene = useRef(null);
  const camera = useRef(null);
  const renderer = useRef(null);
  const planeMesh = useRef(null);

  // Animation variables
  const mousePosition = useRef({ x: 0.5, y: 0.5 });
  const targetMousePosition = useRef({ x: 0.5, y: 0.5 });
  const prevPosition = useRef({ x: 0.5, y: 0.5 });
  const aberrationIntensity = useRef(0.0);
  const easeFactor = useRef(0.02);

  const animateScene = useCallback(() => {
    if (!renderer.current || !planeMesh.current) {
        return;
    }

    mousePosition.current.x += (targetMousePosition.current.x - mousePosition.current.x) * easeFactor.current;
    mousePosition.current.y += (targetMousePosition.current.y - mousePosition.current.y) * easeFactor.current;

    planeMesh.current.material.uniforms.u_mouse.value.set(
      mousePosition.current.x,
      1.0 - mousePosition.current.y
    );

    planeMesh.current.material.uniforms.u_prevMouse.value.set(
      prevPosition.current.x,
      1.0 - prevPosition.current.y
    );

    aberrationIntensity.current = Math.max(0.0, aberrationIntensity.current - 0.05);
    planeMesh.current.material.uniforms.u_aberrationIntensity.value = aberrationIntensity.current;

    renderer.current.render(scene.current, camera.current);
    animationFrameId.current = requestAnimationFrame(animateScene);
  }, []);

  const initializeScene = useCallback((texture) => {
    console.log('--- Initializing scene for URL:', imageUrl, '---');
    if (!imageContainerRef.current) {
      console.error(`[ImageDistortion] imageContainerRef.current is null for ${imageUrl}!`);
      return;
    }
    if (!imageElementRef.current) {
      console.error(`[ImageDistortion] imageElementRef.current is null for ${imageUrl}!`);
      return;
    }

    // Clean up any previous scene/renderer if re-initializing
    if (renderer.current) {
        if (imageContainerRef.current && renderer.current.domElement) {
            if (imageContainerRef.current.contains(renderer.current.domElement)) {
                 imageContainerRef.current.removeChild(renderer.current.domElement);
                 console.log(`[ImageDistortion] Removed previous canvas for ${imageUrl}.`);
            } else {
                 console.warn(`[ImageDistortion] Canvas not found as child for ${imageUrl} during re-init cleanup.`);
            }
        }
        renderer.current.dispose();
        console.log(`[ImageDistortion] Disposed previous renderer for ${imageUrl}.`);
    }
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
    }

    const imageWidth = imageElementRef.current.offsetWidth;
    const imageHeight = imageElementRef.current.offsetHeight;

    console.log(`[ImageDistortion] Image Element Dimensions: ${imageWidth}x${imageHeight} for ${imageUrl}`);
    if (imageWidth === 0 || imageHeight === 0) {
        console.warn(`[ImageDistortion] Image element has zero dimensions (${imageWidth}x${imageHeight}) for ${imageUrl}. Cannot initialize Three.js scene correctly.`);
        console.warn('Please ensure the <img> element or its parent (contact_card-top) has explicit width/height in CSS.');
        return; 
    }

    // --- Calculate aspect ratio for the plane ---
    const aspectRatio = imageWidth / imageHeight;
    // We want the plane to fill the camera's view, so we'll adjust either width or height based on aspect ratio.
    // Assuming the plane starts with height 2 (to fill from -1 to 1 vertically)
    const planeHeight = 2;
    const planeWidth = planeHeight * aspectRatio;
    // If you prefer to fix the width to 2 and adjust height:
    // const planeWidth = 2;
    // const planeHeight = planeWidth / aspectRatio;


    scene.current = new THREE.Scene();

    camera.current = new THREE.PerspectiveCamera(
      80, // Field of view
      imageWidth / imageHeight, // Aspect ratio of the canvas/container
      0.01,
      10
    );
    camera.current.position.z = 1; // Keep the camera position the same

    let shaderUniforms = {
      u_mouse: { type: "v2", value: new THREE.Vector2() },
      u_prevMouse: { type: "v2", value: new THREE.Vector2() },
      u_aberrationIntensity: { type: "f", value: 0.0 },
      u_texture: { type: "t", value: texture }
    };

    planeMesh.current = new THREE.Mesh(
      // --- IMPORTANT CHANGE HERE: Use calculated dimensions for PlaneGeometry ---
      new THREE.PlaneGeometry(planeWidth, planeHeight), 
      new THREE.ShaderMaterial({
        uniforms: shaderUniforms,
        vertexShader,
        fragmentShader
      })
    );

    scene.current.add(planeMesh.current);

    renderer.current = new THREE.WebGLRenderer({ alpha: true });
    renderer.current.setSize(imageWidth, imageHeight);
    renderer.current.setPixelRatio(window.devicePixelRatio); 

    try {
        imageContainerRef.current.appendChild(renderer.current.domElement);
        console.log(`[ImageDistortion] Canvas appended for ${imageUrl}.`);
    } catch (e) {
        console.error(`[ImageDistortion] Failed to append canvas for ${imageUrl}:`, e);
    }
    
    if (renderer.current && planeMesh.current) {
        animateScene();
        isInitializedRef.current = true;
        console.log(`[ImageDistortion] Scene initialized and animation started for ${imageUrl}.`);
    } else {
        console.error(`[ImageDistortion] Scene or renderer not ready after initialization for ${imageUrl}.`);
    }

  }, [animateScene, imageUrl]);

  const handleMouseMove = useCallback((event) => {
    if (!imageContainerRef.current) return;
    easeFactor.current = 0.02;
    const rect = imageContainerRef.current.getBoundingClientRect();
    prevPosition.current = { ...targetMousePosition.current };

    targetMousePosition.current.x = (event.clientX - rect.left) / rect.width;
    targetMousePosition.current.y = (event.clientY - rect.top) / rect.height;

    aberrationIntensity.current = 1;
  }, []);

  const handleMouseEnter = useCallback((event) => {
    if (!imageContainerRef.current) return;
    easeFactor.current = 0.02;
    const rect = imageContainerRef.current.getBoundingClientRect();

    mousePosition.current.x = targetMousePosition.current.x = (event.clientX - rect.left) / rect.width;
    mousePosition.current.y = targetMousePosition.current.y = (event.clientY - rect.top) / rect.height;
    
    aberrationIntensity.current = 1;
  }, []);

  const handleMouseLeave = useCallback(() => {
    easeFactor.current = 0.05;
    targetMousePosition.current = { ...prevPosition.current };
    aberrationIntensity.current = 0;
  }, []);

  useEffect(() => {
    console.log(`[ImageDistortion] useEffect for ${imageUrl} - isInitializedRef.current: ${isInitializedRef.current}, imageElementRef.current: ${!!imageElementRef.current}`);
    
    if (imageUrl && imageElementRef.current && !isInitializedRef.current) { 
      console.log(`[ImageDistortion] Loading texture for ${imageUrl}...`);
      const loader = new THREE.TextureLoader();
      loader.load(imageUrl,
        (texture) => {
          initializeScene(texture);
        },
        undefined,
        (error) => {
          console.error(`[ImageDistortion] Error loading texture for ${imageUrl}:`, error);
        }
      );
    }

    const container = imageContainerRef.current;
    if (container) {
      console.log(`[ImageDistortion] Adding event listeners for ${imageUrl}.`);
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    } else {
      console.log(`[ImageDistortion] Container ref not available for event listeners for ${imageUrl}.`);
    }

    return () => {
      console.log(`[ImageDistortion] Cleaning up for ${imageUrl} (from useEffect cleanup).`);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (renderer.current) {
        renderer.current.dispose();
        console.log(`[ImageDistortion] Renderer disposed for ${imageUrl}.`);
        if (container && renderer.current.domElement) {
            if (container.contains(renderer.current.domElement)) {
                container.removeChild(renderer.current.domElement);
                console.log(`[ImageDistortion] Canvas removed for ${imageUrl}.`);
            } else {
                console.warn(`[ImageDistortion] Canvas not found as child for ${imageUrl} during useEffect cleanup.`);
            }
        }
      }
      isInitializedRef.current = false; 
      
      scene.current = null;
      camera.current = null;
      renderer.current = null;
      planeMesh.current = null;
      animationFrameId.current = null;
    };
  }, [imageUrl, initializeScene, handleMouseMove, handleMouseEnter, handleMouseLeave]);
                                                                                           
  return [imageContainerRef, imageElementRef];
};