// Import THREE and OrbitControls using ES modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HydrogenOrbital } from './orbital.js';

/**
 * Three.js based visualizer for hydrogen atom orbitals
 */
class OrbitalVisualizer {
    /**
     * Initialize the visualizer
     * @param {string} canvasId ID of the canvas element
     */
    constructor(canvasId) {
        // Canvas element
        this.canvas = document.getElementById(canvasId);
        
        // Initialize Three.js scene
        this.initScene();
        
        // Start animation
        this.animate();
        
        // Current orbital parameters
        this.currentN = 1;
        this.currentL = 0;
        this.currentM = 0;
        this.particleCount = 3000;
        
        // Current particle system
        this.particles = null;
        
        // Flag for loading state
        this.isLoading = false;
        
        // Initialize with default orbital
        this.renderOrbital(1, 0, 0, this.particleCount);
        
        // Window resize handler
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    /**
     * Initialize Three.js scene
     */
    initScene() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 10);
        
        // Add orbit controls - fixed: use OrbitControls directly, not from THREE namespace
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Add a nucleus
        this.createNucleus();
        
        // Add coordinate axes (small, faint)
        this.createAxes();
    }
    
    /**
     * Create nucleus visualization
     */
    createNucleus() {
        const nucleusGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const nucleusMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 80
        });
        this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        this.scene.add(this.nucleus);
    }
    
    /**
     * Create faint coordinate axes
     */
    createAxes() {
        const axesLength = 2;
        const axesOpacity = 0.2;
        
        // X axis (red)
        const xAxisGeometry = new THREE.BufferGeometry();
        xAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, axesLength, 0, 0], 3));
        const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: axesOpacity });
        const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
        this.scene.add(xAxis);
        
        // Y axis (green)
        const yAxisGeometry = new THREE.BufferGeometry();
        yAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, axesLength, 0], 3));
        const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: axesOpacity });
        const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
        this.scene.add(yAxis);
        
        // Z axis (blue)
        const zAxisGeometry = new THREE.BufferGeometry();
        zAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, axesLength], 3));
        const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, transparent: true, opacity: axesOpacity });
        const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
        this.scene.add(zAxis);
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.controls.update();
        
        // Slowly rotate the scene for better 3D perception
        if (this.particles) {
            this.particles.rotation.y += 0.001;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Render a hydrogen orbital
     * @param {number} n Principal quantum number
     * @param {number} l Angular quantum number
     * @param {number} m Magnetic quantum number
     * @param {number} particleCount Number of particles to render
     */
    renderOrbital(n, l, m, particleCount) {
        // Prevent multiple loadings
        if (this.isLoading) return;
        this.isLoading = true;
        
        // Remove previous particle system if it exists
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles = null;
        }
        
        // Update current values
        this.currentN = n;
        this.currentL = l;
        this.currentM = m;
        this.particleCount = particleCount;
        
        // Get orbital color
        const color = HydrogenOrbital.getOrbitalColor(l, m);
        
        // Generate particle positions (this can be computationally intensive)
        setTimeout(() => {
            // Generate particle positions
            const positions = HydrogenOrbital.generateOrbitalParticles(n, l, m, particleCount);
            
            // Create geometry
            const geometry = new THREE.BufferGeometry();
            const positionArray = new Float32Array(particleCount * 3);
            
            // Fill position array
            for (let i = 0; i < positions.length; i++) {
                positionArray[i * 3] = positions[i].x;
                positionArray[i * 3 + 1] = positions[i].y;
                positionArray[i * 3 + 2] = positions[i].z;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
            
            // Create material
            const material = new THREE.PointsMaterial({
                color: new THREE.Color(color),
                size: 0.05,
                transparent: true,
                opacity: 0.7,
                sizeAttenuation: true
            });
            
            // Create particle system
            this.particles = new THREE.Points(geometry, material);
            this.scene.add(this.particles);
            
            this.isLoading = false;
        }, 0);
    }
    
    /**
     * Set the particle count
     * @param {number} count New particle count
     */
    setParticleCount(count) {
        if (this.particleCount !== count) {
            this.renderOrbital(this.currentN, this.currentL, this.currentM, count);
        }
    }
}

// Export the OrbitalVisualizer class
export { OrbitalVisualizer }; 