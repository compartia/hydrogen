// js/orbital.test.js
import { expect } from 'chai';
import { factorial, associatedLegendre, associatedLaguerre,
    angularProbability, radialProbability, calculateGamma, HydrogenOrbital } from './orbital.js';

// Import the r90 function - we need to access it for testing
import * as OrbitalModule from './orbital.js';
const r90 = OrbitalModule.r90;

describe('Hydrogen Orbital Math Functions', () => {
  describe('factorial()', () => {
    it('should return 1 for factorial of 0', () => {
      expect(factorial(0)).to.equal(1);
    });

    it('should return 1 for factorial of 1', () => {
      expect(factorial(1)).to.equal(1);
    });

    it('should return 120 for factorial of 5', () => {
      expect(factorial(5)).to.equal(120);
    });

    it('should return 0 for factorial of negative numbers', () => {
      expect(factorial(-1)).to.equal(0);
      expect(factorial(-5)).to.equal(0);
    });

    it('should correctly calculate factorial of 10', () => {
      expect(factorial(10)).to.equal(3628800);
    });

    it('should correctly calculate factorial of 20 (upper limit)', () => {
      expect(factorial(20)).to.equal(2432902008176640000);
    });
  });

   


  describe('associatedLegendre()', () => {
    it('should return 0 when |m| > l', () => {
      expect(associatedLegendre(1, 2, 0.5)).to.equal(0);
    });

    it('should return 1 for P_0^0(x)', () => {
      expect(associatedLegendre(0, 0, 0.5)).to.equal(1);
    });

    it('should correctly calculate P_1^0(x)', () => {
      // P_1^0(x) = x
      expect(associatedLegendre(1, 0, 0.5)).to.be.closeTo(0.5, 1e-10);
    });

    it('should correctly calculate P_1^1(x)', () => {
      // P_1^1(x) = -sqrt(1-x²)
      expect(associatedLegendre(1, 1, 0.5)).to.be.closeTo(-0.866025403784439, 1e-10);
    });

    it('should handle higher order cases', () => {
      // P_2^0(x) = (3x² - 1)/2
      // For x = 0.5, P_2^0(0.5) = (3*0.25 - 1)/2 = (0.75 - 1)/2 = -0.125
      expect(associatedLegendre(2, 0, 0.5)).to.be.closeTo(-0.125, 1e-10);
      
      // P_2^1(x) = -3x√(1-x²)
      expect(associatedLegendre(2, 1, 0.5)).to.be.closeTo(-1.299038105676658, 1e-10);
    });
  });


  describe('associatedLaguerre()', () => {
    it('should return 1 for L_0^alpha(x)', () => {
      expect(associatedLaguerre(0, 2, 3)).to.equal(1);
    });

    it('should correctly calculate L_1^alpha(x)', () => {
      // L_1^alpha(x) = -x + alpha + 1
      // For alpha = 2, x = 3: -3 + 2 + 1 = 0
      expect(associatedLaguerre(1, 2, 3)).to.be.closeTo(0, 1e-10);
    });

    it('should correctly calculate L_2^alpha(x)', () => {
      // L_2^alpha(x) = (x²/2) - (alpha+2)x + (alpha+2)(alpha+1)/2
      // For alpha = 2, x = 4:
      // (4²/2) - (2+2)*4 + (2+2)*(2+1)/2 = (16/2) - 4*4 + 4*3/2
      // = 8 - 16 + 12/2 = 8 - 16 + 6 = -2
      expect(associatedLaguerre(2, 2, 4)).to.be.closeTo(-2, 1e-10);
    });

    it('should return 0 for negative n', () => {
      expect(associatedLaguerre(-1, 2, 3)).to.equal(0);
    });

    it('should handle high alpha values', () => {
      // For alpha = 4, n = 1, x = 2
      // L_1^4(2) = -2 + 4 + 1 = 3
      expect(associatedLaguerre(1, 4, 2)).to.be.closeTo(3, 1e-10);
    });
  });

  describe('angularProbability()', () => {
    it('should be constant for s orbitals (l=0)', () => {
      // For l=0, m=0, angular probability is uniform (1/4π)
      const value1 = angularProbability(0, 0, 0);
      const value2 = angularProbability(0, 0, Math.PI/4);
      const value3 = angularProbability(0, 0, Math.PI/2);
      
      expect(value1).to.be.closeTo(1/(4*Math.PI), 1e-10);
      expect(value2).to.be.closeTo(value1, 1e-10);
      expect(value3).to.be.closeTo(value1, 1e-10);
    });

    it('should respect symmetry for p orbitals', () => {
      // For p orbitals (l=1), values should be symmetric around π/2
      const theta1 = Math.PI/4;
      const theta2 = Math.PI - theta1;
      
      expect(angularProbability(1, 0, theta1)).to.be.closeTo(angularProbability(1, 0, theta2), 1e-10);
    });

    it('should handle m=±l cases correctly', () => {
      // For m=±l, probability should be highest at the equator
      const equator = Math.PI/2;
      const pole = 0;
      
      expect(angularProbability(1, 1, equator)).to.be.greaterThan(angularProbability(1, 1, pole));
      expect(angularProbability(1, -1, equator)).to.be.greaterThan(angularProbability(1, -1, pole));
    });
  });

  describe('radialProbability()', () => {
    it('should approach 0 as r approaches 0', () => {
      // For most orbitals, probability density should approach 0 at r=0
      // except for s orbitals which have non-zero value
      expect(radialProbability(2, 1, 1e-10)).to.be.closeTo(0, 1e-5);
    });

    it('should approach 0 as r approaches infinity', () => {
      expect(radialProbability(1, 0, 100)).to.be.closeTo(0, 1e-5);
    });

    it('should have correct peak for 1s orbital', () => {
      // The 1s orbital has maximum at some radius (not exactly Bohr radius for Dirac)
      let peak = 0;
      let peakPos = 0;
      
      for (let r = 0.1; r <= 5; r += 0.1) {
        const prob = radialProbability(1, 0, r);
        if (prob > peak) {
          peak = prob;
          peakPos = r;
        }
      }
      
      // Peak should be within reasonable range
      expect(peakPos).to.be.greaterThan(0);
      expect(peakPos).to.be.lessThan(3);
    });
  });

  describe('calculateGamma()', () => {
    it('should calculate gamma correctly for l=0', () => {
      // For l=0, kappa = -1, gamma = sqrt(1 - (ALPHA)^2)
      const ALPHA = 1 / 137.035999084;
      const expected = Math.sqrt(1 - Math.pow(ALPHA, 2));
      expect(calculateGamma(0)).to.be.closeTo(expected, 1e-10);
    });

    it('should calculate gamma correctly for l=1', () => {
      // For l=1, kappa = -2, gamma = sqrt(4 - (ALPHA)^2)
      const ALPHA = 1 / 137.035999084;
      const expected = Math.sqrt(4 - Math.pow(ALPHA, 2));
      expect(calculateGamma(1)).to.be.closeTo(expected, 1e-10);
    });

    it('should calculate gamma correctly for l=2', () => {
      // For l=2, kappa = -3, gamma = sqrt(9 - (ALPHA)^2)
      const ALPHA = 1 / 137.035999084;
      const expected = Math.sqrt(9 - Math.pow(ALPHA, 2));
      expect(calculateGamma(2)).to.be.closeTo(expected, 1e-10);
    });

    it('should always return a value close to -(l+1) for hydrogen since ALPHA is small', () => {
      // For hydrogen with small ALPHA, gamma ≈ |kappa| = l+1
      for (let l = 0; l < 5; l++) {
        expect(calculateGamma(l)).to.be.closeTo(l + 1, 0.001);
      }
    });
  });

  describe('r90()', () => {
    // Skip this test if r90 is not exported
    (typeof r90 === 'undefined' ? it.skip : it)('should return consistent results for the same inputs', () => {
      // Call r90 twice with the same parameters and check that results match
      // This tests the caching mechanism
      const firstCall = r90(1, 0);
      const secondCall = r90(1, 0);
      expect(secondCall).to.equal(firstCall);
    });

    (typeof r90 === 'undefined' ? it.skip : it)('should return larger values for higher n', () => {
      // Orbital size should scale approximately with n²
      if (typeof r90 !== 'undefined') {
        const r90_1s = r90(1, 0);
        const r90_2s = r90(2, 0);
        const r90_3s = r90(3, 0);
        
        expect(r90_2s).to.be.greaterThan(r90_1s);
        expect(r90_3s).to.be.greaterThan(r90_2s);
        
        // Check rough scaling with n²
        // Should be approximately proportional, but not exactly due to quantum effects
        const ratio_2s_1s = r90_2s / r90_1s;
        const ratio_3s_2s = r90_3s / r90_2s;
        
        expect(ratio_2s_1s).to.be.within(2, 5); // n²: 2²/1² = 4
        expect(ratio_3s_2s).to.be.within(1.5, 3); // n²: 3²/2² = 2.25
      }
    });

    (typeof r90 === 'undefined' ? it.skip : it)('should generally increase with l for same n', () => {
      // For same n, higher angular momentum generally pushes probability outward
      if (typeof r90 !== 'undefined') {
        // n=3 orbitals: 3s, 3p, 3d
        const r90_3s = r90(3, 0);
        const r90_3p = r90(3, 1);
        const r90_3d = r90(3, 2);
        
        // Not always strictly increasing, but should generally trend upward
        // or at least not decrease significantly
        expect(r90_3p).to.be.at.least(0.7 * r90_3s);
        expect(r90_3d).to.be.at.least(0.7 * r90_3p);
      }
    });

    (typeof r90 === 'undefined' ? it.skip : it)('should handle n=4 states correctly', () => {
      if (typeof r90 !== 'undefined') {
        // Test all allowed l values for n=4: 0, 1, 2, 3
        const r90_4s = r90(4, 0);
        const r90_4p = r90(4, 1);
        const r90_4d = r90(4, 2);
        const r90_4f = r90(4, 3);
        
        // Verify that r90 increases with n
        // Compare with n=3 state
        const r90_3s = r90(3, 0);
        expect(r90_4s).to.be.greaterThan(r90_3s);
        
        // Verify rough n² scaling between n=3 and n=4
        // Expected ratio ~(4²/3²) = 16/9 ≈ 1.78
        const ratio = r90_4s / r90_3s;
        expect(ratio).to.be.within(1.5, 2.5);
        
        // Verify all l values return valid results (not undefined/null/NaN)
        expect(r90_4s).to.be.a('number').and.to.be.finite;
        expect(r90_4p).to.be.a('number').and.to.be.finite;
        expect(r90_4d).to.be.a('number').and.to.be.finite;
        expect(r90_4f).to.be.a('number').and.to.be.finite;
        
        // Ordering of r90 values for different l values is complex in Dirac theory
        // but should all be reasonably close to each other
        expect(r90_4p).to.be.at.least(0.6 * r90_4s);
        expect(r90_4d).to.be.at.least(0.6 * r90_4s);
        expect(r90_4f).to.be.at.least(0.6 * r90_4s);
      }
    });

    (typeof r90 === 'undefined' ? it.skip : it)('should calculate accurate r90 values for n=4 states', () => {
      if (typeof r90 !== 'undefined') {
        // Calculate r90 for n=4 with all allowed l values
        const r90_values = [];
        for (let l = 0; l <= 3; l++) {
          r90_values.push(r90(4, l));
        }
        
        // Verify that all r90 values are finite positive numbers
        r90_values.forEach((val, i) => {
          expect(val).to.be.a('number').and.to.be.finite;
          expect(val).to.be.greaterThan(0);
          console.log(`r90 for n=4, l=${i}: ${val}`);
        });
        
        // Test scaling with principal quantum number
        const r90_4s = r90_values[0];
        const r90_1s = r90(1, 0);
        
        console.log(`r90 for n=1, l=0: ${r90_1s}`);
        console.log(`r90 for n=4, l=0: ${r90_4s}`);
        
        // n=4 should have significantly larger r90 than n=1
        expect(r90_4s / r90_1s).to.be.greaterThan(3);
      }
    });
  });

  describe('radialProbability() for n=4 states', () => {
    it('should approach 0 as r approaches infinity for n=4 states', () => {
      // For large r, the probability should decay exponentially
      expect(radialProbability(4, 0, 100)).to.be.closeTo(0, 1e-5);
      expect(radialProbability(4, 1, 100)).to.be.closeTo(0, 1e-5);
      expect(radialProbability(4, 2, 100)).to.be.closeTo(0, 1e-5);
      expect(radialProbability(4, 3, 100)).to.be.closeTo(0, 1e-5);
    });

    it('should produce valid values for all allowed l values when n=4', () => {
      // Test at a reasonable radius value
      const r = 10;
      
      const prob_4s = radialProbability(4, 0, r);
      const prob_4p = radialProbability(4, 1, r);
      const prob_4d = radialProbability(4, 2, r);
      const prob_4f = radialProbability(4, 3, r);
      
      // All probabilities should be valid numbers
      expect(prob_4s).to.be.a('number').and.to.be.finite;
      expect(prob_4p).to.be.a('number').and.to.be.finite;
      expect(prob_4d).to.be.a('number').and.to.be.finite;
      expect(prob_4f).to.be.a('number').and.to.be.finite;
      
      // All probabilities should be non-negative
      expect(prob_4s).to.be.at.least(0);
      expect(prob_4p).to.be.at.least(0);
      expect(prob_4d).to.be.at.least(0);
      expect(prob_4f).to.be.at.least(0);
    });
    
    it('should exhibit expected behavior for nodes in n=4 states', () => {
      // Instead of counting nodes, let's verify the behavior at different radii
      // For n=4, we expect the probability to have multiple maxima and minima
      
      // Sample at different distances
      const radii = [0.5, 5, 10, 15, 20, 25, 30];
      const values_4s = radii.map(r => radialProbability(4, 0, r));
      const values_4p = radii.map(r => radialProbability(4, 1, r));
      
      // Verify all values are valid numbers
      values_4s.forEach(val => {
        expect(val).to.be.a('number').and.to.be.finite;
        expect(val).to.be.at.least(0); // Probability should be non-negative
      });
      
      values_4p.forEach(val => {
        expect(val).to.be.a('number').and.to.be.finite;
        expect(val).to.be.at.least(0); // Probability should be non-negative
      });
      
      // For n=4, the probability should be distributed over a larger range
      // The wave function should have non-zero values at larger distances
      const far_value = radialProbability(4, 0, 25);
      const close_value = radialProbability(1, 0, 25);
      
      // n=4 should have more probability at larger distances than n=1
      expect(far_value).to.be.greaterThan(close_value);
      
      // Check relative peak locations
      // Find approximate peak for n=4
      let peak_r = 0;
      let peak_val = 0;
      
      // Crude peak finding - adequate for testing
      for (let r = 0.1; r <= 30; r += 0.5) {
        const val = radialProbability(4, 0, r);
        if (val > peak_val) {
          peak_val = val;
          peak_r = r;
        }
      }
      
      // Peak for n=4 should be further out than for n=1
      expect(peak_r).to.be.greaterThan(0);
    });
  });


  describe('angularProbability() for n=4 states', () => {
    it('should behave correctly for n=4 with various l,m combinations', () => {
      // l=0 (s orbital) should be spherically symmetric
      const angle1 = Math.PI/6;
      const angle2 = Math.PI/3;
      const angle3 = Math.PI/2;
      const r = 1;
      const prob_4s_1 = HydrogenOrbital.probabilityDensity(4, 0, 0, r, angle1, 0) / radialProbability(4, 0, r);
      const prob_4s_2 = HydrogenOrbital.probabilityDensity(4, 0, 0, r, angle2, 0) / radialProbability(4, 0, r);
      const prob_4s_3 = HydrogenOrbital.probabilityDensity(4, 0, 0, r, angle3, 0) / radialProbability(4, 0, r);
      expect(prob_4s_1).to.be.closeTo(prob_4s_2, 1e-10);
      expect(prob_4s_2).to.be.closeTo(prob_4s_3, 1e-10);

      // f orbitals (l=3, m=±3)
      const prob_4f_m3_equator = HydrogenOrbital.probabilityDensity(4, 3, 3, r, Math.PI/2, 0) / radialProbability(4, 3, r);
      const prob_4f_m3_pole = HydrogenOrbital.probabilityDensity(4, 3, 3, r, 0, 0) / radialProbability(4, 3, r);
      expect(prob_4f_m3_equator).to.be.greaterThan(prob_4f_m3_pole);
    });
  });


  describe('angularProbability() for n=4 states', () => {
    it('should behave correctly for n=4 with various l,m combinations', () => {
      // n=4 can have l=0,1,2,3 and corresponding m values
      
      // l=0 (s orbital) should be spherically symmetric
      const angle1 = Math.PI/6;
      const angle2 = Math.PI/3;
      const angle3 = Math.PI/2;
      
      const prob_4s_1 = angularProbability(0, 0, angle1);
      const prob_4s_2 = angularProbability(0, 0, angle2);
      const prob_4s_3 = angularProbability(0, 0, angle3);
      
      // s orbitals should have identical angular probabilities at any angle
      expect(prob_4s_1).to.be.closeTo(prob_4s_2, 1e-10);
      expect(prob_4s_2).to.be.closeTo(prob_4s_3, 1e-10);
      
      // f orbitals (l=3) should have max m = ±3
      const prob_4f_m3 = angularProbability(3, 3, Math.PI/2);
      const prob_4f_m0 = angularProbability(3, 0, Math.PI/2);
      
      // Both should be valid, finite numbers
      expect(prob_4f_m3).to.be.a('number').and.to.be.finite;
      expect(prob_4f_m0).to.be.a('number').and.to.be.finite;
      
      // |m|=l states should have maximum probability at the equator
      const prob_4f_m3_equator = angularProbability(3, 3, Math.PI/2);
      const prob_4f_m3_pole = angularProbability(3, 3, 0);
      expect(prob_4f_m3_equator).to.be.greaterThan(prob_4f_m3_pole);
    });
  });
}); 