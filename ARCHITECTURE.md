# MISSION: LAST LIGHT — Comprehensive System Architecture & Engineering Plan (v2.0)

**NASA Space Apps Challenge 2026: Space Mission Design Game**  
*Tagline: "Design. Stress-test. Adapt. Survive."*  
*Product Positioning: "MISSION: LAST LIGHT is a scientifically grounded interactive space mission engineering simulator where every design decision creates consequences."*

---

## 1. Executive Summary & Core Game Concept

**MISSION: LAST LIGHT** is an interactive engineering strategy game disguised as a deep-space exploration mission. Rather than acting as a static configuration form or an academic trajectory calculator, it immerses players in authentic aerospace systems engineering:

$$\text{DESIGN} \longrightarrow \text{STRESS TEST} \longrightarrow \text{REDESIGN} \longrightarrow \text{LAUNCH} \longrightarrow \text{ADAPT} \longrightarrow \text{SURVIVE} \longrightarrow \text{DEBRIEF}$$

### 1.1 Primary Showcase Mission: ASTERIA-1
- **Mission Tagline**: *"The asteroid won't wait."*
- **Target**: Near-Earth Asteroid **101955 Bennu** (B-type carbonaceous near-Earth asteroid).
- **Mission Directive**: Design, validate, launch, and operate an autonomous robotic spacecraft to rendezvous with a near-Earth asteroid, survey its volatile-rich surface, gather spectral and altimetric data, survive harsh deep-space transit and space weather hazards, and safely downlink high-priority scientific payloads back to NASA's Deep Space Network (DSN) under rigid resource constraints.
- **Scope & Delivery Priority**: ASTERIA-1 is the primary showcase and the single focus of the Initial Playable Vertical Slice. Secondary scenarios (*Lunar Shadow*, *Mars Window*, *Random Mission Generator*, and *Real Mission Recreations*) are structured as modular expansions unlocked after the core ASTERIA-1 loop is fully polished. Real Mission Recreations are clearly marked: *"Additional mission recreations coming soon."*

### 1.2 Core Multi-Variable Trade-off Philosophy
Every component choice affects at least three interrelated variables across the spacecraft bus. No component is a pure upgrade:
- Mass (kg)
- Cost ($M USD)
- Power Draw / Generation (W)
- Propellant & Delta-V Capacity (m/s)
- Science Data Generation Rate (kbps / points)
- Communication Bandwidth & Downlink Margin (dB)
- Subsystem Reliability & Mean Time Between Failures
- Thermal Operating Envelope (K) & Dissipation (W)
- Radiation Hardness (krad)
- Single Points of Failure & Mission Risk Modifiers

---

## 2. Revised Core Game Loop

```
[ MISSION BRIEFING: ASTERIA-1 ]
           │
           ▼
[ DEFINE PRIMARY & SECONDARY OBJECTIVES ]
           │
           ▼
[ SELECT LAUNCH VEHICLE & TARGET PARAMETERS ]
           │
           ▼
[ MODULAR SPACECRAFT DESIGNER (8 Subsystems) ]
  ├── Power Bus (Solar / RTG / Battery)
  ├── Propulsion (Chemical / Ion / RCS)
  ├── Telecom (S-band / X-band / Ka-band / DSN Schedule)
  ├── Navigation & Avionics (Rad-hardened / Dual-redundant)
  ├── Thermal Control (MLI Blankets / Louvers / Heaters)
  └── Science Payload (Cameras / Spectrometers / Altimeters)
           │
           ▼
[ LIVE MISSION READINESS & BUDGET TRIANGLE ]
  ├── Live Readiness % & Category Breakdown
  ├── Primary Weakness Diagnostic & Prescriptive Feedback
  └── Science vs. Survivability vs. Affordability Triangle
           │
           ▼
[ INTERACTIVE PRE-LAUNCH STRESS TEST ]
  ├── Run 8 Spaceflight Stress Scenarios (Solar Storm, Comm Loss, etc.)
  ├── Identify Engineering Bottlenecks & Weak Links
  └── Choices: [REDESIGN] ───┐
               [RUN AGAIN]   │
               [LAUNCH ANYWAY]◄┘
           │
           ▼
[ TRAJECTORY PLANNER & LAUNCH WINDOW ]
           │
           ▼
[ TIME-BASED MISSION SIMULATION (8 Stages) ]
  ├── Stage Transitions (Pre-Launch ➔ Launch ➔ Insertion ➔ Cruise ➔ Approach ➔ Science ➔ Telecom ➔ End)
  ├── Live Telemetry Bus (Power, Battery SoC, Fuel, Thermal, Buffer, Subsystem Health)
  ├── Foreshadowed Multi-Stage Anomalies (Advisory ➔ Warning ➔ Critical Event)
  └── Tactical Player Actions: [SAFE MODE] [MANEUVER] [REBOOT] [OBSERVE] [TRANSMIT] [WARP]
           │
           ▼
[ RECOVERABLE FAILURE / MITIGATION RESOLUTION ]
  ├── Bad Decision ➔ System Damage ➔ Player Response ➔ Recovery / Partial / Total
           │
           ▼
[ CINEMATIC MISSION DEBRIEF & TIMELINE REPLAY ]
  ├── 30–60 Second Automated Mission Timeline Replay
  ├── 8-Axis Performance Radar & Composite Mission Score
  └── Causal Root-Cause Engine ("Why Your Mission Succeeded / Failed")
           │
           ▼
[ MISSION MEMORY & LEADERBOARD ]
  ├── Retain Spacecraft Design & Failure Analysis in localStorage
  ├── Retry Options: [REUSE & MODIFY] or [START FROM SCRATCH]
  └── Category Leaderboards (Science Hunter, Survival Expert, Engineering Master, etc.)
```

---

## 3. Scientific Models & Educational Approximations

The underlying simulation is grounded in real orbital mechanics, electrical engineering, and thermodynamics, while the user presentation adapts seamlessly to player expertise via **Dual Interface Modes**:

- **Commander Mode (Beginners)**: Clean, intuitive bars displaying *Fuel*, *Power*, *Science*, *Risk*, *Communications*, and *Mission Readiness %*. Complex formulas are abstracted into clear qualitative and percentage metrics.
- **Engineer Mode (Advanced)**: Full telemetry exposure displaying $\Delta v$, $I_{sp}$, $C_3$, Link Margin (dB), Data Rates, Thermal Margin (K), Battery Depth-of-Discharge (DoD), and Radiation Tolerance (krad).
- **Educational Tooltips**: Every engineering parameter features an interactive `[INFO]` modal with concise, plain-English explanations and authentic NASA context.

### 3.1 Mathematical Foundations
1. **Propulsion (Tsiolkovsky Rocket Equation)**:
   $$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_{\text{dry}} + m_{\text{propellant}}}{m_{\text{dry}}}\right)$$
   *Trade-off*: Ion thrusters offer $I_{sp} \approx 3,100\text{ s}$ but require massive solar/RTG wattage and deliver millinewton thrust (slow spiral transfers). Chemical thrusters offer instant high thrust ($I_{sp} \approx 220\text{--}320\text{ s}$) but their fuel mass scales exponentially with payload weight.

2. **Orbital Transfers (Patched Conics & Vis-Viva)**:
   $$v^2 = \mu \left(\frac{2}{r} - \frac{1}{a}\right)$$
   Models Earth departure energy ($C_3$), heliocentric transfer ellipses, and asteroid rendezvous braking burns.

3. **Solar Irradiance (Inverse-Square Law)**:
   $$S(d) = S_0 \cdot \left(\frac{1\text{ AU}}{d}\right)^2 \quad (S_0 = 1361\text{ W/m}^2)$$
   At Bennu's aphelion ($1.356\text{ AU}$), solar power drops to $\approx 54\%$ of Earth orbit levels.

4. **Communications Link Budget (Friis Transmission)**:
   $$P_r = P_t \cdot G_t \cdot G_r \cdot \left(\frac{\lambda}{4 \pi d}\right)^2 \cdot L_{\text{misc}}$$
   Downlink bitrate drops quadratically with distance. Players must balance High-Gain Antenna (HGA) dish diameter, transmitter wattage, and onboard Solid-State Recorder (SSR) buffer capacity to prevent data overflow.

5. **Thermal Equilibrium (Stefan-Boltzmann)**:
   $$Q_{\text{solar}} + Q_{\text{internal}} = \epsilon \sigma A T^4 + Q_{\text{heaters}}$$
   Tracks core avionics temperature against operational limits ($170\text{ K} \le T \le 340\text{ K}$) during cruise, sun-pointing orientations, and eclipses.

---

## 4. Mission Readiness System & The Budget Triangle

### 4.1 Live Mission Readiness Calculator
Before launch, the game continuously computes a composite **Mission Readiness %** based on 8 sub-indices:

$$\text{Readiness} = \sum_{i=1}^{8} w_i \cdot \text{SubsystemScore}_i$$

- **Science Readiness**: Instrument variety matching mission objectives, sensor resolution, and measurement redundancy.
- **Propulsion Readiness**: $\Delta v$ margin above required transfer trajectory + attitude control budget.
- **Power Readiness**: Generation vs. consumption balance at destination distance + battery DoD safety margin.
- **Communications Readiness**: Total data throughput capacity over mission duration vs. expected instrument data volume.
- **Thermal Readiness**: Cold/hot soak thermal margins under worst-case sun angles.
- **Reliability Readiness**: Mean failure probability based on component tiers and single-points-of-failure (SPOFs).
- **Budget Compliance**: Adherence to scenario cost cap + contingency reserves.
- **Resource Margin**: Mass margin against launch vehicle $C_3$ lift capacity.

#### Primary Weakness Diagnostic
The system dynamically pinpoints the lowest-scoring subsystem and provides actionable engineering advice:
> **PRIMARY WEAKNESS: COMMUNICATIONS (52%)**  
> *"Your multi-spectral imager and LIDAR suite will generate ~18.4 GB of data at Bennu, but your 0.5m X-band antenna can only downlink ~7.1 GB across scheduled DSN passes. High risk of data overflow and lost science return."*  
> *Recommended Action: Upgrade to a 1.2m Ka-band High-Gain Antenna or increase Solid-State Recorder capacity to 32 GB.*

### 4.2 The Mission Budget Triangle
Players must navigate three inherently competing mission philosophies:
```
                   SCIENCE
                    /   \
                   /     \
                  /   •   \  Current Spacecraft Bias
                 /         \
   SURVIVABILITY ----------- AFFORDABILITY
```
- **Science Bias**: Expensive, heavy, power-hungry instruments that maximize scientific yield but leave razor-thin mass and power margins.
- **Survivability Bias**: Rad-hardened avionics, redundant thrusters, heavy MLI shielding, and dual transponders. Extremely safe and reliable, but high cost and low science payload capacity.
- **Affordability Bias**: Commercial-off-the-shelf (COTS) parts, single-string architectures, and minimal mass. High budget efficiency, but elevated failure risk under space hazards.

*No configuration is labeled "best"*—the player defines their mission identity.

---

## 5. Pre-Launch Mission Stress Test

The **Mission Stress Test** allows players to simulate high-stress space hazards against their actual spacecraft configuration before committing to launch:

| Stress Test Scenario | Evaluation Mechanics | Favorable Configuration | Critical Vulnerability |
| :--- | :--- | :--- | :--- |
| **1. Solar Storm (CME)** | Compares computing radiation tolerance (krad) & chassis shielding against a 100 krad coronal mass ejection. | Rad-hardened RAD750 processor ($\ge 100\text{ krad}$) + aluminum-tantalum shielding $\rightarrow$ **PASS**. | Commercial ARM processor ($< 30\text{ krad}$) $\rightarrow$ **CRITICAL RISK: Memory bitflips & bus freeze**. |
| **2. Communication Outage** | Simulates a 14-day DSN station scheduling conflict during peak asteroid mapping. | Large 64 GB Solid-State Recorder $\rightarrow$ **PASS (Data safely buffered)**. | Small 8 GB buffer $\rightarrow$ **DATA LOSS: 9.8 GB overwritten**. |
| **3. Propulsion Degradation** | Injects a 25% primary thruster chamber pressure loss during rendezvous burn. | Secondary Hydrazine RCS thruster installed $\rightarrow$ **RECOVERABLE (Burn time extended)**. | Single-string main engine $\rightarrow$ **FAILURE: Asteroid flyby overshoot**. |
| **4. Thermal Anomaly** | Simulates a stuck passive thermal louver during solar closest approach ($0.89\text{ AU}$). | Active survival louvers + heat pipes $\rightarrow$ **NOMINAL**. | Pure passive MLI blanket $\rightarrow$ **OVERHEAT: Battery life degraded 40%**. |
| **5. Battery Degradation** | Tests battery capacity during a 90-minute target eclipse at Bennu. | Lithium-Sulfur cells with $< 40\%$ Depth-of-Discharge $\rightarrow$ **PASS**. | Undersized Li-ion pack ($> 85\%$ DoD) $\rightarrow$ **VOLTAGE COLLAPSE: Bus brownout**. |
| **6. Micrometeoroid Impact** | Tests Whipple bumper shield against debris strike on propellant tanks. | Whipple micrometeoroid shielding present $\rightarrow$ **DAMAGE MITIGATED**. | Unshielded propellant bladder $\rightarrow$ **LEAK HAZARD: 18% fuel vented**. |
| **7. Navigation Error** | Simulates optical star tracker blinding during thruster plume firing. | Dual star trackers + backup IMU $\rightarrow$ **AUTO-CORRECTED**. | Single star tracker $\rightarrow$ **ORIENTATION LOSS: Ground contact delayed 48 hrs**. |
| **8. Unexpected Science Discovery** | Simulates detection of volatile outgassing plume requiring immediate burn to observe. | Surplus $\Delta v \ge 120\text{ m/s}$ + power margin $\ge 150\text{ W}$ $\rightarrow$ **BONUS SCIENCE (+35%)**. | Zero fuel/power margin $\rightarrow$ **OPPORTUNITY MISSED**. |

After running the stress test, the player can choose:
- `[REDESIGN]`: Return to the spacecraft builder to fix identified vulnerabilities.
- `[RUN STRESS TEST AGAIN]`: Re-verify after making adjustments.
- `[LAUNCH ANYWAY]`: Accept the calculated engineering risks and proceed to the pad.

---

## 6. Simulation Engine, Foreshadowing & Recoverable Failures

### 6.1 Multi-Stage Event Foreshadowing
Hazards do not strike without warning. The simulation employs a three-tier foreshadowing pipeline that creates authentic Mission Control tension:

```
[ STAGE 1: TELEMETRY ADVISORY ]
"MISSION CONTROL: Solar monitor satellites detect coronal magnetic shear."
                  │
                  ▼ (MET + 18 hours)
[ STAGE 2: FORMAL WARNING ]
"WARNING: Extreme proton flux wave en route. Arrival window in 4 hours."
                  │
                  ▼ (MET + 4 hours)
[ STAGE 3: HAZARD EVENT TRIGGERED ]
"CRITICAL EVENT: Solar Particle Storm engulfing spacecraft."
                  │
                  ▼
[ INTERACTIVE PLAYER INTERVENTION ]
[SAFE MODE]  [REORIENT BUS]  [CONTINUE SCIENCE]  [RECONFIGURE POWER]
```

### 6.2 Recoverable Failure Architecture
Spacecraft failures are non-binary. Catastrophic "instant game over" is eliminated in favor of consequential, recoverable operational choices:

```
    UNMITIGATED HAZARD (e.g., Solar Storm hits commercial avionics)
                           │
                           ▼
                    SYSTEM DAMAGE
        (Flight computer register corruption / bus lockup)
                           │
                           ▼
               CHOOSE EMERGENCY RESPONSE
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
 [SAFE MODE]        [REBOOT SYSTEM]     [PUSH THROUGH]
  Shuts down non-    Power cycles bus;   Maintains active
  essential science. clears soft error.  science observation.
  Telemetry offline   18-hr mission       Risk of permanent
  for 24 hours.      time loss.          hardware burnout.
      │                    │                    │
      ▼                    ▼                    ▼
RECOVERY (Minor     RECOVERY (Moderate   TOTAL/PARTIAL
science delay)      schedule slip)       FAILURE (Subsystem dead)
```

---

## 7. Cinematic Debrief, Causal Engine & Mission Memory

### 7.1 30–60 Second Cinematic Timeline Replay
Upon mission conclusion (success, partial success, or failure), the Debrief Screen presents an automated, animated chronological mission replay:
- Visual timeline with animated icons marking key milestones (Launch, Earth Departure, Solar Storm Encounter, Safe Mode Recovery, Asteroid Arrival, Science Mapping, Final DSN Downlink).
- Each node expands with a four-part debrief card:
  1. **Your Decision**: Component chosen or operational command executed.
  2. **What Happened**: Real-time simulation event triggered.
  3. **Why It Happened**: Direct causal link to spacecraft architecture.
  4. **Mission Consequence**: Impact on science yield, fuel reserve, or spacecraft health.

### 7.2 8-Axis Performance Radar & Scoring
Scored across 8 distinct dimensions (0–100):
1. **Scientific Return**: Objectives completed, data quality, bonus discoveries.
2. **Engineering Efficiency**: Mass margin efficiency, payload-to-wet-mass fraction.
3. **Budget Discipline**: Cost under scenario cap, science yield per million dollars.
4. **Mission Survivability & Reliability**: Health maintained across all subsystems.
5. **Risk Management**: Readiness score, contingency margins, safe mode discipline.
6. **Telecom Performance**: Percent of generated science data downlinked without buffer overflow.
7. **Propellant Discipline**: Remaining $\Delta v$ available for potential extended missions.
8. **Thermal & Power Stability**: Battery cycle preservation, zero thermal violations.

### 7.3 Mission Memory (localStorage)
- Persists previous spacecraft configurations, launch vehicles, trajectories, and failure analyses.
- On mission retry, displays:
  > **PREVIOUS MISSION DEBRIEF SUMMARY**  
  > *"ASTERIA-1 Flight 01 failed to achieve full science return because communication downlink capacity (7.1 GB) was inadequate for the high-res spectrometer payload (18.4 GB)."*  
  > `[REUSE & MODIFY PREVIOUS DESIGN]` | `[START FROM SCRATCH]`

---

## 8. Category-Focused Leaderboard

Rather than promoting a single "ideal" meta-build, the leaderboard celebrates diverse engineering strategies:

1. 🔬 **SCIENCE HUNTER**: Highest raw scientific return and instrument diversity.
2. ⚙️ **ENGINEERING MASTER**: Highest engineering efficiency (payload ratio and power optimization).
3. 🛡️ **SURVIVAL EXPERT**: Highest overall spacecraft reliability and zero subsystem failures.
4. 📡 **COMMUNICATION MASTER**: 100% data recovery with zero buffer dropouts and highest downlink throughput.
5. 💰 **RESOURCE MASTER**: Lowest total cost and highest remaining propellant margin.

---

## 9. NASA Data Hub Architecture & Authenticity

Every dataset shown in the game is backed by real, documented NASA data:

```typescript
export interface NASADataCatalogEntry {
  id: string;
  source: string; // e.g., "NASA JPL Solar System Dynamics"
  datasetName: string; // e.g., "JPL Small-Body Database (SBDB)"
  targetEntity: string; // e.g., "101955 Bennu (1999 RQ36)"
  description: string;
  referenceUrl: string;
  inGameEffect: string; // Specific gameplay formula influenced
  payloadData: Record<string, any>;
}
```

- **Target 101955 Bennu**: Authentic orbital parameters ($a = 1.1264\text{ AU}$, $e = 0.20375$, $i = 6.035^\circ$), rotation period ($4.296\text{ hrs}$), diameter ($490\text{ m}$), bulk density ($1190\text{ kg/m}^3$). Directly sets $\Delta v$ rendezvous requirements and solar flux curves.
- **Deep Space Network (DSN)**: Realistic frequency bands (X-band 8.4 GHz, Ka-band 32 GHz) and antenna ground stations (Goldstone, Madrid, Canberra).
- **Launch Services Program (LSP)**: Authentic $C_3$ curves for Falcon 9, Falcon Heavy, and Atlas V.
- **Offline Guarantee**: Pre-bundled authentic JSON fallback datasets ensure seamless, 100% offline judging.

---

## 10. Comprehensive TypeScript Data Models

```typescript
// Core Subsystem Categories
export type SubsystemCategory =
  | 'power'
  | 'propulsion'
  | 'communications'
  | 'navigation'
  | 'computing'
  | 'thermal'
  | 'science'
  | 'structure';

// Spacecraft Component Specification
export interface SpacecraftComponent {
  id: string;
  name: string;
  category: SubsystemCategory;
  tier: 'commercial' | 'space_proven' | 'deep_space_hardened' | 'cutting_edge';
  massKg: number;
  costM: number;
  powerDrawW: number; // Negative = power generation
  reliability: number; // 0.0 - 1.0
  scienceYield: number;
  dataRateKbps: number;
  storageCapacityMb?: number;
  propellantCapacityKg?: number;
  thrustN?: number;
  ispSec?: number;
  radiationToleranceKrad: number;
  thermalDissipationW: number;
  redundancySupported: boolean;
  riskModifiers: {
    singlePointOfFailure: boolean;
    spaceWeatherVulnerability: number; // 0.0 (immune) to 1.0 (vulnerable)
    micrometeoroidVulnerability: number;
  };
  nasaReference: {
    missionUsed: string;
    dataset: string;
    citation: string;
  };
}

// Live Mission Readiness Breakdown
export interface MissionReadinessReport {
  overallPercentage: number;
  breakdown: {
    science: number;
    propulsion: number;
    power: number;
    communications: number;
    thermal: number;
    reliability: number;
    budget: number;
    resourceMargin: number;
  };
  primaryWeakness: {
    category: SubsystemCategory | 'budget' | 'margin';
    title: string;
    explanation: string;
    suggestedAction: string;
  };
  budgetTriangle: {
    science: number; // 0 - 100
    survivability: number; // 0 - 100
    affordability: number; // 0 - 100
  };
}

// Pre-Launch Stress Test Result
export interface StressTestScenarioResult {
  scenarioId: string;
  title: string;
  hazardDescription: string;
  testedSubsystem: SubsystemCategory;
  componentTested: string;
  thresholdRequired: string;
  spacecraftValue: string;
  status: 'PASS' | 'WARNING' | 'CRITICAL_RISK';
  projectedConsequence: string;
}

// Foreshadowed Simulation Event
export interface ForeshadowedEvent {
  id: string;
  title: string;
  fazeLevel: 'advisory' | 'warning' | 'critical';
  triggerMetDay: number;
  headline: string;
  details: string;
  availableActions: Array<{
    id: string;
    label: string;
    description: string;
    sciencePenaltyPct?: number;
    timeLossHours?: number;
    riskOfBurnoutPct?: number;
  }>;
}

// Cinematic Debrief Timeline Item
export interface CinematicTimelineItem {
  metDay: number;
  stageName: string;
  icon: string;
  decisionMade: string;
  whatHappened: string;
  whyItHappened: string;
  missionConsequence: string;
  severity: 'nominal' | 'caution' | 'critical' | 'triumph';
}
```

---

## 11. Revised Development Priority Roadmap

To guarantee a fully playable, cohesive, and deeply polished vertical slice, development proceeds strictly in the following priority order:

1. **PRIORITY 1**: Fully playable **ASTERIA-1** scenario definition & targets.
2. **PRIORITY 2**: Core resource & multi-variable trade-off engine (Mass, Power, Cost, $\Delta v$, Friis, Thermal).
3. **PRIORITY 3**: Spacecraft designer (8 subsystems, 3D visualizer, live bus stats).
4. **PRIORITY 4**: Live **Mission Readiness System** & **Budget Triangle**.
5. **PRIORITY 5**: Interactive **Mission Stress Test** (8 scenarios, pre-launch diagnostics).
6. **PRIORITY 6**: 8-stage time-based **Mission Simulation Engine** with Commander & Engineer mode views.
7. **PRIORITY 7**: **Foreshadowed Event Engine** & **Recoverable Failure** player decisions.
8. **PRIORITY 8**: Premium NASA Mission Control UI, telemetry graphs, and Web Audio synthesizer.
9. **PRIORITY 9**: **Cinematic Mission Debrief** (30–60s timeline replay, 8-axis radar, causal reasoner).
10. **PRIORITY 10**: **NASA Data Hub** integration & authentic JPL dataset inspector.
11. **PRIORITY 11**: Second mission scenario (*Mars Window* or *Lunar Shadow*).
12. **PRIORITY 12**: Random Mission Generator.
13. **PRIORITY 13**: Real Mission Recreation mode (unlocked as secondary bonus).

*Strict Delivery Rule*: If time becomes constrained, development halts after **Priority 10** to maximize polish, stability, and zero-defect execution on the ASTERIA-1 showcase experience.
