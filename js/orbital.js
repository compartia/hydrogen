// hydrogen‑orbital.js  (pure ES module)
// -----------------------------------------------------------
// Dirac‑based hydrogen orbital utilities – public interface
// identical to the earlier Schrödinger stub
// -----------------------------------------------------------

// Import low‑discrepancy sampler
import { HaltonGenerator } from "./halton.js";

/* ---------- physical constants (atomic units) ------------ */
const ALPHA = 1 / 137.035999084; // fine‑structure constant
const Z = 1; // hydrogen (Z = 1)
const FOUR_PI = 4 * Math.PI;

/* ---------- Helper: Binomial coefficient for (n + alpha choose n - k) --- */
function computeBinomial(n, alpha, k) {
  const m = n - k; // We need (n + alpha choose m)
  if (m < 0) return 0;

  // Compute numerator: (n + alpha)(n + alpha - 1)...(n + alpha - m + 1)
  let numerator = 1;
  for (let i = 0; i < m; i++) {
    numerator *= n + alpha - i;
  }

  // Denominator: m!
  const denominator = factorial(m);

  return numerator / denominator;
}

/* ---------- associated Legendre P_l^m(x)  ----------------- */
function associatedLegendre(l, m, x) {
  m = Math.abs(m);
  if (m > l) return 0;

  // P_m^m
  let pmm = 1.0;
  if (m > 0) {
    let fact = 1;
    const somx2 = Math.sqrt((1 - x) * (1 + x));
    for (let i = 1; i <= m; i++) {
      pmm *= -fact * somx2;
      fact += 2;
    }
  }
  if (l === m) return pmm;

  // P_{m+1}^m
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;

  // upward recursion
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll++) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1;
    pmmp1 = pll;
  }
  return pll;
}

/* ---------- |Y_l^m|²  (real form, includes φ) ------------------------ */
function angularProbability(l, m, theta, phi = 0) {
  // Real spherical-harmonic squares for low l (enough for s and p)
  if (l === 0) {
    // s-orbitals – isotropic
    return 1; // constant factor cancels in rejection sampling
  }
  if (l === 1) {
    // p-orbitals – real form (px, py, pz)
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    if (m === 0) {
      // pz  ∝ cos θ ⇒ |ψ|² ∝ cos² θ
      return cosT * cosT;
    }
    if (m === -1) {
      // px  ∝ sin θ cos φ ⇒ |ψ|² ∝ sin² θ cos² φ
      const cosP = Math.cos(phi);
      return sinT * sinT * cosP * cosP;
    }
    if (m === 1) {
      // py  ∝ sin θ sin φ ⇒ |ψ|² ∝ sin² θ sin² φ
      const sinP = Math.sin(phi);
      return sinT * sinT * sinP * sinP;
    }
  }

  // Fallback – φ-averaged associated Legendre (works for higher l, complex form)
  const absM = Math.abs(m);
  const norm =
    ((2 * l + 1) / FOUR_PI) * (factorial(l - absM) / factorial(l + absM));
  const P = associatedLegendre(l, absM, Math.cos(theta));
  return norm * P * P;
}

/* ---------- calculate gamma from angular momentum quantum number -------- */
function calculateGamma(l) {
  const kappa = -(l + 1); // κ for j = l + ½ → κ = -(l + 1)
  return Math.sqrt(kappa * kappa - Math.pow(Z * ALPHA, 2));
}

/* ---------- spin‑averaged Dirac radial density ------------ */
function radialProbability(n, l, r) {
  // κ for j = l + ½ → κ = -(l + 1)
  const kappa = -(l + 1);
  const gamma = calculateGamma(l);
  const n_r = n - Math.abs(kappa); // radial quantum number
  const rho = (2 * Z * r) / n; // scaled radius

  /* --- large component (approx.) ------------------------- *
   *  G ∝ ρ^{γ-1} e^{-ρ/2} L^{2γ}_{n_r}(ρ)
   *  For visual fidelity up to n=3 we set L ≈ 1 when n_r = 0.
   *  TODO: replace with full Laguerre for perfect accuracy. */
  //   let laguerre = 1;
  //   if (n_r > 0) {
  //     // crude 1st‑order Laguerre approximation (good enough visually)
  //     laguerre = 1 - rho / (1 + 2 * gamma);
  //   }

  const laguerre = associatedLaguerre(n_r, 2 * gamma, rho);

  const G = Math.pow(rho, gamma - 1) * Math.exp(-rho / 2) * laguerre;
  const F = ((ALPHA * Z) / (n + gamma)) * G; // small component
  return G * G + F * F; // probability density (unnorm.)
}

/* ---------- 90 % cumulative radius cache ----------------- */
const r90Cache = new Map();

/**
 * Calculates the radius containing 90% of the electron probability.
 *
 * Uses numerical integration of the radial probability density from r=0
 * outward until reaching 90% of the total probability.
 *
 * @param {number} n - Principal quantum number
 * @param {number} l - Angular momentum quantum number
 * @returns {number} - Radius containing 90% of the probability
 */
function r90(n, l) {
  // Check cache first to avoid redundant calculations
  const key = `${n}-${l}`;
  if (r90Cache.has(key)) return r90Cache.get(key);

  // Initialize numerical integration variables
  let cum = 0; // cumulative probability
  let r = 0; // current radius

  // Step size scales with n² because orbital size scales with n²
  const dr = 0.02 * n * n;

  // Perform numerical integration until either:
  // 1. We reach 90% of probability (cum >= 0.9), or 95% for l=0 orbitals, or
  // 2. r exceeds 40*n² (safety limit to prevent infinite loops)
  //
  // The 40*n² upper bound is chosen because:
  // - Hydrogen orbital sizes scale with n²
  // - For all valid orbitals, 90% probability is reached well before 40*n²
  // - This is a safety factor (~10-20x larger than typical r90 values)
  const targetCum = l === 0 ? 0.95 : 0.9;
  while (cum < targetCum && r < 40 * n * n) {
    // Integrate: radial probability × volume element (r²dr)
    cum += radialProbability(n, l, r) * r * r * dr;
    r += dr;
  }

  // Store result in cache for future use
  r90Cache.set(key, r);
  return r;
}

/* =========================================================
   Public class – same shape as original Schrödinger stub
   ========================================================= */
class HydrogenOrbital {
  

  /* ---- Dirac probability density |ψ|² ------------------ */
  static probabilityDensity(n, l, m, r, theta, phi) {
    return (
      radialProbability(n, l, r) *
      angularProbability(l, m, theta, phi) *
      r * r // include volume element so density is proportional to probability in Cartesian space
    );
  }

  /* ---- particle cloud generator ------------------------ */
  static generateOrbitalParticles(n, l, m, particleCount = 10000) {
    const particles = [];

    // Pre-compute an approximate global maximum of the full probability density
    // Scan radial coordinate up to 6 n² a.u. (safe upper bound)
    let maxDensity = 0;
    const rMax = 6 * n * n;
    const radialSteps = 120;
    for (let i = 0; i <= radialSteps; i++) {
      const r = (i / radialSteps) * rMax;
      const radPart = radialProbability(n, l, r) * r * r;
      if (radPart > maxDensity) maxDensity = radPart;
    }

    // Angular part can at most be 1 with our real definitions for s and p
    const pMax = maxDensity; // upper bound of total density

    let idx = 1;
    while (particles.length < particleCount) {
      // Candidate: direction uniform on sphere via Halton
      const spherical = HaltonGenerator.sphericalPoint(idx++); // { r,θ,φ } in [0,1)

      // Pick radius uniformly in volume up to rMax (cube-root transform)
      const r = rMax * Math.cbrt(spherical.r);
      const theta = spherical.theta;
      const phi = spherical.phi;

      const density =
        radialProbability(n, l, r) * r * r * angularProbability(l, m, theta, phi);

      if (Math.random() < density / pMax) {
        const sinT = Math.sin(theta);
        const x = r * sinT * Math.cos(phi);
        const y = r * sinT * Math.sin(phi);
        const z = r * Math.cos(theta);
        particles.push({ x, y, z });
      }
    }
    return particles;
  }

  /* ---- colour helper (Balmer palette) ------------------ */
  static getOrbitalColor(l, m) {
    if (l === 1) {
      // p‑orbitals
      return ["#ff4455", "#66ffff", "#cc66ff"][m + 1];
    }
    if (l === 0) return "#999999"; // s
    return "#cccccc"; // default grey for higher l
  }

  /* ---- LaTeX label ------------------------------------- */
  static getOrbitalFormula(n, l, m) {
    const letters = ["s", "p", "d", "f", "g", "h"];
    const L = letters[l] || `l=${l}`;
    return `\\psi_{${n}${L}}(r,\\theta,\\phi)=R_{${n}${l}}(r)\\,Y^{${m}}_{${l}}(\\theta,\\phi)`;
  }
}

/* ---------- Associated Laguerre polynomial L_n^alpha(x) ----------------- */
// function associatedLaguerre(n, alpha, x) {
//   if (n < 0 || !Number.isInteger(n)) return 0; // Invalid n
//   if (x < 0) return 0; // Laguerre polynomials are typically evaluated for x >= 0

//   // For n = 0, L_0^alpha(x) = 1
//   if (n === 0) return 1;

//   let result = 0;
//   for (let k = 0; k <= n; k++) {
//     // Compute binomial coefficient (n + alpha choose n - k)
//     const binomial = computeBinomial(n, alpha, k);
//     // Term: (-1)^k * binomial * x^k / k!
//     const term = (Math.pow(-1, k) * binomial * Math.pow(x, k)) / factorial(k);
//     result += term;
//   }
//   return result;
// }

function associatedLaguerre(n, alpha, x) {
    if (n < 0 || !Number.isInteger(n) || x < 0) return 0;
    if (n === 0) return 1;
  
    let result = 0;
    for (let k = 0; k <= n; k++) {
      const binomial = computeBinomial(n, alpha, k);
      const term = (Math.pow(-1, k) * binomial * Math.pow(x, k)) / factorial(k);
      result += term;
    }
    return result;
  }

/* ---------- Factorial (reused from original code) ----------------------- */
function factorial(n) {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// named exports (same as original file plus additional math functions for testing)
export {
  HydrogenOrbital,
  factorial,
  associatedLegendre,
  angularProbability,
  radialProbability,
  calculateGamma,
  associatedLaguerre,
  r90,
};
