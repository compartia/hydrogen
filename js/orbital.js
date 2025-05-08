// Import HaltonGenerator
import { HaltonGenerator } from './halton.js';

/**
 * Hydrogen atom orbital calculation functions
 * Based on the Dirac equation solutions for the hydrogen atom
 */
class HydrogenOrbital {
    /**
     * Calculate the radial wavefunction value
     * @param {number} n Principal quantum number
     * @param {number} l Angular quantum number
     * @param {number} r Radius (in atomic units)
     * @returns {number} Value of radial wavefunction at r
     */
    static radialWavefunction(n, l, r) {
        // Scaled radius
        const rho = 2 * r / n;
        
        // Normalization constant
        const norm = Math.sqrt(
            Math.pow(2 / n, 3) * 
            factorial(n - l - 1) / 
            (2 * n * factorial(n + l))
        );
        
        // Calculate Laguerre polynomial
        const laguerrePoly = this.associatedLaguerre(n - l - 1, 2 * l + 1, rho);
        
        // Complete radial function
        return norm * Math.exp(-rho / 2) * Math.pow(rho, l) * laguerrePoly;
    }
    
    /**
     * Calculate the spherical harmonic value
     * @param {number} l Angular quantum number
     * @param {number} m Magnetic quantum number
     * @param {number} theta Polar angle
     * @param {number} phi Azimuthal angle
     * @returns {object} Complex value of spherical harmonic
     */
    static sphericalHarmonic(l, m, theta, phi) {
        const absM = Math.abs(m);
        
        // Normalization constant
        const norm = Math.sqrt(
            ((2 * l + 1) * factorial(l - absM)) / 
            (4 * Math.PI * factorial(l + absM))
        );
        
        // Associated Legendre polynomial
        const legendrePoly = this.associatedLegendre(l, absM, Math.cos(theta));
        
        // For simplicity, we'll just use the real part of the spherical harmonic
        // for visualization purposes
        // In a more accurate implementation, we would handle complex values properly
        const phaseFactor = Math.cos(m * phi);
        
        // For negative m, apply additional phase factor
        const phase = (m < 0) ? Math.pow(-1, absM) : 1;
        
        // Return the spherical harmonic value (simplified for visualization)
        return norm * legendrePoly * phaseFactor * phase;
    }
    
    /**
     * Simplified implementation for associated Laguerre polynomials
     * @param {number} n Parameter of the Laguerre polynomial
     * @param {number} alpha Parameter of the Laguerre polynomial
     * @param {number} x Value at which to evaluate
     * @returns {number} Value of the associated Laguerre polynomial
     */
    static associatedLaguerre(n, alpha, x) {
        if (n === 0) return 1;
        if (n === 1) return 1 + alpha - x;
        
        // Use recurrence relation for higher orders
        let L0 = 1;
        let L1 = 1 + alpha - x;
        
        for (let i = 1; i < n; i++) {
            const L2 = ((2 * i + 1 + alpha - x) * L1 - (i + alpha) * L0) / (i + 1);
            L0 = L1;
            L1 = L2;
        }
        
        return L1;
    }
    
    /**
     * Simplified implementation for associated Legendre polynomials
     * @param {number} l Parameter of the Legendre polynomial
     * @param {number} m Parameter of the Legendre polynomial
     * @param {number} x Value at which to evaluate
     * @returns {number} Value of the associated Legendre polynomial
     */
    static associatedLegendre(l, m, x) {
        // Implementation for the most common cases
        if (l === 0 && m === 0) return 1;
        if (l === 1 && m === 0) return x;
        if (l === 1 && m === 1) return -Math.sqrt(1 - x * x);
        
        // For higher orders, use a simplified approximation
        // This is a simplification - in a production context, a complete implementation would be needed
        if (m === 0) {
            // Recursion for m=0
            let P0 = 1;
            let P1 = x;
            
            for (let i = 1; i < l; i++) {
                const P2 = ((2 * i + 1) * x * P1 - i * P0) / (i + 1);
                P0 = P1;
                P1 = P2;
            }
            
            return P1;
        } else if (m === l) {
            // P_l^l
            const factor = Math.pow(-1, m) * 
                factorial(2 * m) / 
                (Math.pow(2, m) * factorial(m));
            
            return factor * Math.pow(1 - x * x, m / 2);
        } else if (m === l - 1) {
            // P_l^(l-1)
            return x * (2 * l - 1) * this.associatedLegendre(l - 1, l - 1, x);
        }
        
        // For other cases, use recursion
        return ((2 * l - 1) * x * this.associatedLegendre(l - 1, m, x) - 
                (l + m - 1) * this.associatedLegendre(l - 2, m, x)) / (l - m);
    }
    
    /**
     * Calculate the wavefunction probability for a hydrogen orbital
     * @param {number} n Principal quantum number
     * @param {number} l Angular quantum number
     * @param {number} m Magnetic quantum number
     * @param {number} r Radius
     * @param {number} theta Polar angle
     * @param {number} phi Azimuthal angle
     * @returns {number} Probability density at the given point
     */
    static probabilityDensity(n, l, m, r, theta, phi) {
        // For visualization we use the probability density |ψ|²
        const R = this.radialWavefunction(n, l, r);
        const Y = this.sphericalHarmonic(l, m, theta, phi);
        
        // |ψ|² = R²|Y|²
        return R * R * Y * Y;
    }
    
    /**
     * Generate a set of particles representing the orbital
     * @param {number} n Principal quantum number
     * @param {number} l Angular quantum number
     * @param {number} m Magnetic quantum number
     * @param {number} particleCount Number of particles to generate
     * @returns {Array} Array of particle positions
     */
    static generateOrbitalParticles(n, l, m, particleCount) {
        const particles = [];
        const rejected = new Set();
        let accepted = 0;
        const maxAttempts = particleCount * 10;
        let attempts = 0;
        
        // Determine maximum radius for the orbital
        const maxRadius = n * n * 2;
        
        while (accepted < particleCount && attempts < maxAttempts) {
            const idx = attempts + 1;
            if (rejected.has(idx)) {
                attempts++;
                continue;
            }
            
            // Use Halton sequence for sampling
            const spherical = HaltonGenerator.sphericalPoint(idx);
            
            // Scale radius based on orbital size
            spherical.r *= maxRadius;
            
            // Calculate probability at this point
            const probability = this.probabilityDensity(n, l, m, spherical.r, spherical.theta, spherical.phi);
            
            // Accept or reject based on probability
            const randomValue = Math.random();
            if (randomValue < probability / 0.1) {
                const cartesian = HaltonGenerator.sphericalToCartesian(
                    spherical.r, spherical.theta, spherical.phi
                );
                particles.push(cartesian);
                accepted++;
            } else {
                rejected.add(idx);
            }
            
            attempts++;
        }
        
        return particles;
    }
    
    /**
     * Get the color for a given orbital
     * @param {number} l Angular quantum number
     * @param {number} m Magnetic quantum number
     * @returns {string} Hex color code
     */
    static getOrbitalColor(l, m) {
        // Basic colors for different orbital types
        const colors = {
            s: '#3498db', // Blue for s orbitals
            p: {
                '-1': '#e74c3c', // Red for p_x
                '0': '#2ecc71',  // Green for p_y
                '1': '#f39c12'   // Orange for p_z
            },
            d: {
                '-2': '#9b59b6', // Purple
                '-1': '#1abc9c', // Turquoise
                '0': '#e67e22',  // Dark orange
                '1': '#34495e',  // Navy
                '2': '#2980b9'   // Blue
            },
            f: {
                '-3': '#8e44ad', // Purple
                '-2': '#16a085', // Green
                '-1': '#d35400', // Orange
                '0': '#2c3e50',  // Dark blue
                '1': '#c0392b',  // Red
                '2': '#27ae60',  // Green
                '3': '#f1c40f'   // Yellow
            }
        };
        
        if (l === 0) return colors.s;
        if (l === 1) return colors.p[m];
        if (l === 2) return colors.d[m];
        if (l === 3) return colors.f[m];
        
        // Default color
        return '#7f8c8d';
    }
    
    /**
     * Get the LaTeX formula for a given orbital
     * @param {number} n Principal quantum number
     * @param {number} l Angular quantum number
     * @param {number} m Magnetic quantum number
     * @returns {string} LaTeX formula
     */
    static getOrbitalFormula(n, l, m) {
        const orbitalTypes = ['s', 'p', 'd', 'f', 'g', 'h'];
        const orbitalType = orbitalTypes[l] || l;
        
        // Return the formula in LaTeX format
        return `\\psi_{${n}${orbitalType}}(r,\\theta,\\phi) = R_{${n}${l}}(r) \\cdot Y_{${l}}^{${m}}(\\theta,\\phi)`;
    }
}

/**
 * Calculate factorial
 * @param {number} n Number
 * @returns {number} n!
 */
function factorial(n) {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    
    return result;
}

// Export the HydrogenOrbital class and factorial function
export { HydrogenOrbital, factorial }; 