/**
 * Halton sequence generator for low-discrepancy sampling
 */
class HaltonGenerator {
    /**
     * Generate a Halton sequence value for a given index and base
     * @param {number} index The index in the sequence
     * @param {number} base The base for the sequence
     * @returns {number} Value between 0 and 1
     */
    static halton(index, base) {
        let result = 0;
        let f = 1 / base;
        let i = index;
        
        while (i > 0) {
            result = result + f * (i % base);
            i = Math.floor(i / base);
            f = f / base;
        }
        
        return result;
    }
    
    /**
     * Generate a 3D point using Halton sequences
     * @param {number} index The index in the sequence
     * @returns {object} Object with x, y, z coordinates
     */
    static point3D(index) {
        // Use primes 2, 3, 5 as bases for the three dimensions
        return {
            x: this.halton(index, 2) * 2 - 1, // Map to [-1, 1]
            y: this.halton(index, 3) * 2 - 1,
            z: this.halton(index, 5) * 2 - 1
        };
    }
    
    /**
     * Generate a spherical point using Halton sequences
     * @param {number} index The index in the sequence
     * @returns {object} Object with spherical coordinates (r, theta, phi)
     */
    static sphericalPoint(index) {
        return {
            r: this.halton(index, 2),                 // Radius [0, 1]
            theta: this.halton(index, 3) * Math.PI,   // Polar angle [0, π]
            phi: this.halton(index, 5) * 2 * Math.PI  // Azimuthal angle [0, 2π]
        };
    }
    
    /**
     * Convert spherical coordinates to Cartesian
     * @param {number} r Radius
     * @param {number} theta Polar angle
     * @param {number} phi Azimuthal angle
     * @returns {object} Object with x, y, z coordinates
     */
    static sphericalToCartesian(r, theta, phi) {
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(theta);
        
        return { x, y, z };
    }
}

// Export the HaltonGenerator class
export { HaltonGenerator }; 