import type { SpacecraftDesign } from '../src/types/subsystems.ts';
import { COMPONENT_CATALOG } from '../src/data/components.ts';
import { LAUNCH_VEHICLE_CATALOG } from '../src/data/launchers.ts';
import { SCENARIO_CATALOG } from '../src/data/scenarios.ts';

export function getComponent(id: string) {
  const comp = COMPONENT_CATALOG.find((c) => c.id === id);
  if (!comp) throw new Error(`Component ${id} not found in catalog`);
  return comp;
}

export function getLauncher(id: string) {
  const launcher = LAUNCH_VEHICLE_CATALOG.find((l) => l.id === id);
  if (!launcher) throw new Error(`Launcher ${id} not found in catalog`);
  return launcher;
}

export function getScenario(id: string) {
  const scenario = SCENARIO_CATALOG.find((s) => s.id === id);
  if (!scenario) throw new Error(`Scenario ${id} not found in catalog`);
  return scenario;
}

/**
 * Creates a nominal, high-readiness spacecraft design for ASTERIA-1:
 * Equipped with UltraFlex solar, MMH/NTO main engine + Hydrazine RCS,
 * 1.2m X-band HGA, RAD750 computer, dual star trackers, MLI + louvers,
 * PolyCam multi-spectral camera + LIDAR altimeter, and CFRP bus + Whipple shield.
 */
export function createNominalAsteria1Design(): SpacecraftDesign {
  return {
    name: 'ASTERIA-1 Nominal Pathfinder',
    components: {
      power: [
        getComponent('pwr_ultraflex_solar'),
        getComponent('pwr_lithium_sulfur_battery')
      ],
      propulsion: [
        getComponent('prop_bipropellant_mmh'),
        getComponent('prop_hydrazine_rcs')
      ],
      communications: [
        getComponent('comm_xband_hga_12m'),
        getComponent('comm_sband_lga_omni')
      ],
      computing: [
        getComponent('comp_rad750_hardened')
      ],
      navigation: [
        getComponent('nav_dual_star_trackers')
      ],
      thermal: [
        getComponent('therm_passive_mli_louvers'),
        getComponent('therm_active_heatpipes_rhu')
      ],
      science: [
        getComponent('sci_multispectral_imager'),
        getComponent('sci_lidar_altimeter')
      ],
      structure: [
        getComponent('struct_carbon_composite_bus'),
        getComponent('struct_whipple_debris_shield')
      ]
    }
  };
}

/**
 * Creates a budget-conscious, commercial-grade spacecraft with vulnerabilities:
 * COTS processor (vulnerable to solar storm), small buffer (comms overflow risk),
 * single thruster (no redundancy), no Whipple shield.
 */
export function createBudgetVulnerableDesign(): SpacecraftDesign {
  return {
    name: 'ASTERIA-1 Budget Scout',
    components: {
      power: [
        getComponent('pwr_rigid_silicon')
      ],
      propulsion: [
        getComponent('prop_hydrazine_rcs')
      ],
      communications: [
        getComponent('comm_sband_lga_omni')
      ],
      computing: [
        getComponent('comp_cots_arm_dual')
      ],
      navigation: [
        getComponent('nav_dual_star_trackers')
      ],
      thermal: [
        getComponent('therm_passive_mli_louvers')
      ],
      science: [
        getComponent('sci_regolith_xray_spectrometer')
      ],
      structure: [
        getComponent('struct_carbon_composite_bus')
      ]
    }
  };
}
