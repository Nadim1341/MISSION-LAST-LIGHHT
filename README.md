# MISSION: LAST LIGHT

### Design the mission. Survive the unexpected. Bring the science home.

NASA Space Apps Challenge 2026  
Challenge: Space Mission Design Game  
Reference Scenario: ASTERIA-1 (Near-Earth Asteroid Rendezvous with 101955 Bennu)

---

## 1. Overview

MISSION: LAST LIGHT is an interactive aerospace engineering and deep-space mission simulation game. Unlike static configurators or simplified clickers, this simulation puts the player in the role of Flight Director and Chief Systems Engineer at NASA. 

The game operates on a core design philosophy:

DESIGN -> STRESS TEST -> REDESIGN -> LAUNCH -> ADAPT -> SURVIVE -> DEBRIEF

Every engineering decision creates causal consequences throughout the mission lifecycle. Over-allocating mass reduces launch vehicle margin; undersizing solid-state memory risks buffer overflow during Deep Space Network (DSN) tracking blackouts; selecting commercial off-the-shelf (COTS) processors saves budget but exposes the bus to severe bitflips and autonomous resets during Coronal Mass Ejections (CMEs).

---

## 2. Aerospace Equations and Mathematical Models

The simulation engine implements peer-reviewed orbital mechanics, thermodynamics, and communication link equations:

### 2.1 Propulsion and Delta-V (Tsiolkovsky Rocket Equation)
Available velocity change is calculated directly from dry mass, propellant loading, and effective specific impulse:

$$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_0}{m_f}\right)$$

Where:
- $g_0 = 9.80665 \text{ m/s}^2$ (standard gravitational acceleration)
- $m_0 = m_{\text{dry}} + m_{\text{prop}}$ (initial wet mass)
- $m_f = m_{\text{dry}}$ (final dry mass after burns)
- $I_{sp}$ is weighted across primary bipropellant chemical engines and reaction control thrusters.

### 2.2 Launch Vehicle C3 Characteristic Energy Interpolation
Payload mass capability to interplanetary trajectory is derived from empirical launch vehicle performance curves via piecewise linear interpolation:

$$m_{\text{capacity}}(C_3) = m_1 + \frac{C_3 - C_{3,1}}{C_{3,2} - C_{3,1}} \cdot (m_2 - m_1)$$

Where $C_3$ for the ASTERIA-1 Bennu rendezvous window is $14.8 \text{ km}^2/\text{s}^2$.

### 2.3 Solar Irradiance and Inverse-Square Power Scaling
Photovoltaic electrical generation scales with heliocentric distance $d$ (in AU):

$$S(d) = S_0 \cdot \left(\frac{1}{d}\right)^2$$
$$P_{\text{gen}}(d) = P_{1\text{AU}} \cdot \left(\frac{1}{d}\right)^2 + P_{\text{RTG}}$$

Where $S_0 = 1361 \text{ W/m}^2$ at Earth, dropping to approximately $350 \text{ W}$ at Bennu's aphelion ($1.36 \text{ AU}$). Radioisotope Thermoelectric Generators (RTGs) provide constant baseline output unaffected by distance.

### 2.4 Battery Depth-of-Discharge (DoD)
During planetary shadow or asteroid occultation eclipses:

$$\text{DoD} = \frac{P_{\text{load}} \cdot t_{\text{eclipse}}}{E_{\text{battery}}}$$

DoD exceeding $70\%$ inflicts permanent cell degradation; DoD exceeding $90\%$ causes total bus brownout.

### 2.5 Communications and Friis Path Loss
Deep Space Network downlink throughput is modeled as a function of carrier frequency, transmitter power, onboard dish aperture gain, and distance:

$$\text{Rate}(d) = \text{Rate}_{1\text{AU}} \cdot \left(\frac{1}{d}\right)^2 \cdot \left(\frac{D_{\text{ground}}}{34\text{ m}}\right)^2$$

One-way light time (OWLT) delay is computed from coordinate distance:

$$t_{\text{OWLT}} = \frac{d \cdot 149597870.7 \text{ km}}{299792.458 \text{ km/s}}$$

### 2.6 Radiative Equilibrium Temperature (Stefan-Boltzmann)
Spacecraft core bus temperature in deep space balances absorbed solar flux, internal avionics dissipation, and thermal radiator emission:

$$T_{\text{eq}} = \left[\frac{\alpha \cdot A_{\text{proj}} \cdot S(d) + Q_{\text{internal}}}{\varepsilon \cdot \sigma \cdot A_{\text{rad}}}\right]^{1/4}$$

Where $\sigma = 5.670374419 \times 10^{-8} \text{ W}/(\text{m}^2 \text{K}^4)$.

---

## 3. Subsystem Architecture

The spacecraft bus features 8 critical subsystem slots with realistic NASA hardware choices:

1. Power: UltraFlex GaAs circular solar arrays, rigid silicon panels, or Next-Gen Radioisotope Thermoelectric Generators (RTG), coupled with Lithium-Sulfur space-qualified batteries.
2. Propulsion: Monomethylhydrazine/Nitrogen Tetroxide (MMH/NTO) hypergolic bipropellant, hydrazine monopropellant RCS, or NEXT-C Gridded Ion Propulsion.
3. Communications: 1.2m Parabolic X-band High-Gain Antenna (HGA), Deep Space Optical Communications (DSOC) Ka-band laser package, and omnidirectional S-band low-gain antennas (LGA).
4. Command and Data Handling: 100 krad BAE RAD750 radiation-hardened processor vs. commercial dual ARM Cortex avionics; 8 GB to 64 GB Solid-State Recorders (SSR).
5. Navigation and Guidance: Autonomous Star Trackers, Deep Space Optical Navigation (OpNav), and Sun Sensors.
6. Thermal Control: Multi-Layer Insulation (MLI) blankets, bimetallic louvers, loop heat pipes, and Radioisotope Heater Units (RHUs).
7. Science Payload: Multispectral PolyCam Imager, OSIRIS-REx Laser Altimeter (OLA) LIDAR, and Regolith X-Ray Imaging Spectrometer (REXIS).
8. Structure and Shielding: Carbon-composite bus frames and hypervelocity Whipple debris shields.

---

## 4. Gameplay Progression

### Phase 1: Mission Design
- Allocate mass, electrical power, thermal envelope, and communications bandwidth within a hard $300M budget cap.
- Select launch vehicle (Falcon 9, Atlas V 401, Falcon Heavy, Electron) based on payload C3 capability curves.
- Switch between Commander Mode (executive metrics) and Flight Dynamics Engineer Mode (raw technical telemetry, thermal margins, Friis path loss).

### Phase 2: Pre-Launch Stress Testing
- Subject the configured spacecraft to 8 simulated spaceflight hazards:
  1. Solar Proton Storm (CME)
  2. DSN Ground Station Maintenance Outage
  3. Hypervelocity Micrometeoroid Swarm
  4. Propulsion System Pressure Anomaly
  5. Deep-Space Cold Eclipse Soak
  6. Optical Navigation Glare
  7. Asteroid Volatile Plume Ejecta
  8. Battery Cell Degradation
- Review failure modes and choose between redesigning vulnerable subsystems or accepting launch risks.

### Phase 3: Flight Simulation and Anomaly Triage
- Monitor interplanetary transit through dual orbital views:
  - Heliocentric Interplanetary Cruise: Animated solar corona, AU range rings, Earth/Moon tracking, and dynamic DSN radio wave propagation.
  - 101955 Bennu Proximity Survey: Asteroid 3D contour, crater shadows, green LIDAR fan sweeps, and active outgassing plumes.
- Triage foreshadowed in-flight anomalies with genuine causal hardware resolution:
  - Spacecraft equipped with RAD750 avionics absorb CME radiation with zero damage (+15 science yield for storm observation).
  - Unshielded hulls suffer micrometeoroid punctures and vent propellant; Whipple-shielded hulls sustain zero structural loss.
  - Adequate solid-state recorders buffer data during 72-hour DSN outages; undersized buffers overflow and lose science yield.

### Phase 4: Post-Flight Mission Debrief
- Receive a Planetary Science Division Evaluation Dossier with composite score (0 to 1000 points) and Rank Tier (Tier S through Tier F).
- Review 8-axis scoring breakdown:
  1. Scientific Return
  2. Engineering Efficiency
  3. Budget Discipline
  4. System Reliability
  5. Risk Management
  6. Telecom Performance
  7. Resource Discipline
  8. Thermal and Power Stability
- Examine root-cause causal analysis ("Why your decisions mattered") and replay the mission timeline before launching a redesign.

---

## 5. Technology Stack

- Language: TypeScript 5.6
- Framework: React 18
- Build Tool: Vite 5.4
- 3D Rendering Engine: Three.js (WebGL hardware-accelerated spacecraft bus, MLI gold foil shaders, dynamic thruster exhaust plumes, and starfield particles)
- Styling: Tailwind CSS with custom glassmorphism, HUD corner accents, and CRT scanlines
- Audio Synthesis: Pure Web Audio API procedural synthesizer (telemetry clicks, thruster pulse rumbles, warning klaxons, and discovery chimes)
- Testing Framework: Node.js Native Test Runner (`node --test`)

---

## 6. Project Structure

```
d:/NASA/
├── src/
│   ├── components/
│   │   ├── common/              # Tooltips, modal shells, mode toggles
│   │   ├── debrief/             # NASA post-flight debrief dossier
│   │   ├── designer/            # 3D visualizer, component selector, meters
│   │   └── simulation/          # Dual orbit views, anomaly triage modal
│   ├── data/
│   │   ├── components.ts        # NASA hardware specifications catalog
│   │   ├── launchers.ts         # Empirical C3 launch vehicle data
│   │   └── scenarios.ts         # ASTERIA-1 mission requirements
│   ├── engine/
│   │   ├── math/                # Tsiolkovsky, power, comms, thermal, orbital
│   │   ├── prng.ts              # Deterministic Mulberry32 random generator
│   │   ├── readiness.ts         # 8-axis readiness index and weakness detector
│   │   ├── scoring.ts           # Debrief scoring and causal factors engine
│   │   ├── stressTest.ts        # 8-hazard hardware stress test runner
│   │   └── validator.ts         # Hard constraint and soft warning checks
│   ├── simulation/
│   │   ├── engine.ts            # Simulation tick and state transition engine
│   │   └── events.ts            # Foreshadowed hazards and causal decisions
│   ├── types/                   # TypeScript interfaces and telemetry contracts
│   └── utils/
│       └── audio.ts             # Web Audio API telemetry synthesizer
├── tests/                       # 47 unit and hostile QA stress tests
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 7. Installation and Local Execution

### Prerequisites
- Node.js version 22.0.0 or higher
- npm version 10.0.0 or higher

### Steps

1. Clone the repository:
```bash
git clone https://github.com/Nadim1341/MISSION-LAST-LIGHT.git
cd MISSION-LAST-LIGHT
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000/`.

4. Execute the test suite:
```bash
npm test
```
All 47 tests will execute across budget, mass, power, propellant, communications, science, constraints, stress testing, and hostile QA boundary conditions.

5. Compile production bundle:
```bash
npm run build
```

---

## 8. License

This project is created for the NASA Space Apps Challenge 2026 under the MIT License.
NASA mission names, datasets, and spacecraft parameters (OSIRIS-REx, Bennu, Dawn, MAVEN, Europa Clipper) are sourced from NASA Jet Propulsion Laboratory (JPL) Horizons and NASA Planetary Data System (PDS) public records.
