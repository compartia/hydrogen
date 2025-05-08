# Hydrogen Atom Orbital Visualizer

A mobile-friendly, interactive 3D visualization of hydrogen atom electron orbitals based on quantum mechanics and the Dirac equation solutions.

## Features

- **Accurate Physical Model**: Visualizations based on solutions to the Dirac equation
- **Interactive 3D**: Rotate and zoom to explore orbital shapes
- **Complete Orbital Set**: Support for s, p, d, and f orbitals
- **Quantum Number Selection**: Dynamically adjust principal (n), angular (l), and magnetic (m) quantum numbers
- **Particle-Based Rendering**: Uses Halton sequences for low-discrepancy point sampling
- **Formula Display**: Shows wavefunction expressions using LaTeX rendering
- **Color-Coded Orbitals**: Different orbital types are distinguished by color

## Technologies Used

- **Three.js**: WebGL-based 3D rendering
- **KaTeX**: LaTeX formula rendering
- **Halton Sequences**: Low-discrepancy sampling algorithm

## Usage

1. Open `index.html` in a web browser
2. Use the controls to select different quantum numbers:
   - Principal quantum number (n): Determines the energy level
   - Angular quantum number (l): Determines the orbital shape (s, p, d, f, etc.)
   - Magnetic quantum number (m): Determines the orbital orientation
3. Adjust the particle count slider to increase/decrease particle density
4. Use mouse or touch controls to rotate and zoom the visualization

## Running Locally

This is a static web application that can be run locally without a server:

1. Clone this repository
2. Open `index.html` in a modern web browser

## Online Demo

You can access the visualization online at: [GitHub Pages Link]

## License

MIT

## Credits

This project was created as an educational tool to visualize quantum mechanical concepts in an accessible and engaging way.
