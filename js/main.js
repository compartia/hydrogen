// Import OrbitalVisualizer and HydrogenOrbital
import { OrbitalVisualizer } from './visualizer.js';
import { HydrogenOrbital } from './orbital.js';

/**
 * Main application script for Hydrogen Orbital Visualizer
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize visualizer
    const visualizer = new OrbitalVisualizer('orbital-canvas');
    
    // DOM elements
    const nSelect = document.getElementById('n-value');
    const lSelect = document.getElementById('l-value');
    const mSelect = document.getElementById('m-value');
    const particleCountSlider = document.getElementById('particle-count');
    const particleCountValue = document.getElementById('particle-count-value');
    const formulaElement = document.getElementById('formula');
    
    // Current quantum numbers
    let currentN = 1;
    let currentL = 0;
    let currentM = 0;
    
    /**
     * Update allowed values for l based on selected n
     */
    function updateLValues() {
        const n = parseInt(nSelect.value);
        
        // Clear existing options
        lSelect.innerHTML = '';
        
        // Add options for l (0 to n-1)
        for (let l = 0; l < n; l++) {
            const option = document.createElement('option');
            option.value = l;
            
            // Add orbital type label (s, p, d, f, etc.)
            const orbitalTypes = ['s', 'p', 'd', 'f', 'g', 'h'];
            const orbitalType = l < orbitalTypes.length ? orbitalTypes[l] : l.toString();
            
            option.textContent = `${l} (${orbitalType})`;
            lSelect.appendChild(option);
        }
        
        // Enable the select
        lSelect.disabled = false;
        
        // Update m values when l changes
        updateMValues();
    }
    
    /**
     * Update allowed values for m based on selected l
     */
    function updateMValues() {
        const l = parseInt(lSelect.value);
        
        // Clear existing options
        mSelect.innerHTML = '';
        
        // Add options for m (-l to +l)
        for (let m = -l; m <= l; m++) {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m.toString();
            mSelect.appendChild(option);
        }
        
        // Enable the select
        mSelect.disabled = false;
    }
    
    /**
     * Render the formula using KaTeX
     */
    function renderFormula() {
        const formula = HydrogenOrbital.getOrbitalFormula(currentN, currentL, currentM);
        katex.render(formula, formulaElement);
    }
    
    /**
     * Update the orbital visualization
     */
    function updateOrbital() {
        currentN = parseInt(nSelect.value);
        currentL = parseInt(lSelect.value);
        currentM = parseInt(mSelect.value);
        const particleCount = parseInt(particleCountSlider.value);
        
        // Update the visualization
        visualizer.renderOrbital(currentN, currentL, currentM, particleCount);
        
        // Update the formula
        renderFormula();
    }
    
    // Initialize event listeners
    nSelect.addEventListener('change', () => {
        updateLValues();
        updateOrbital();
    });
    
    lSelect.addEventListener('change', () => {
        updateMValues();
        updateOrbital();
    });
    
    mSelect.addEventListener('change', updateOrbital);
    
    particleCountSlider.addEventListener('input', () => {
        particleCountValue.textContent = particleCountSlider.value;
        visualizer.setParticleCount(parseInt(particleCountSlider.value));
    });
    
    // Initialize the UI
    updateLValues();
    updateOrbital();
    
    // Initial formula render
    renderFormula();
}); 