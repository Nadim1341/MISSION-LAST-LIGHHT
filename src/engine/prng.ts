/**
 * Mulberry32 32-bit deterministic PRNG.
 * Produces high-quality uniform pseudo-random floats in [0, 1) with zero external dependencies.
 */
export class DeterministicPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Generates next pseudo-random floating point number in [0, 1).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns true with given probability (0.0 to 1.0).
   */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Returns the current internal 32-bit state for serialization/checkpointing.
   */
  public getState(): number {
    return this.state;
  }

  /**
   * Resets or restores the PRNG state.
   */
  public setState(state: number): void {
    this.state = state >>> 0;
  }
}
