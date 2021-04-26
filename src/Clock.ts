export enum Ordering {
  Equal,
  Greater,
  Less,
}

/** Implements a Lamport Clock */
export class Clock {
  actorId: string;
  counter: number;

  constructor(actorId: string, counter: number = 0) {
    this.actorId = actorId;
    this.counter = counter;
  }

  /** Returns a new Clock with same actor but counter incremented by 1. */
  inc(): Clock {
    return new Clock(this.actorId, this.counter + 1);
  }

  /** Increments the clock counter */
  tick(): Clock {
    this.counter += 1;
    return new Clock(this.actorId, this.counter);
  }

  /** Returns a new clock with the same actor but the counter is the larger of the two */
  merge(clock: Clock): Clock {
    return new Clock(this.actorId, Math.max(this.counter, clock.counter));
  }

  /** Compare the ordering of the current Clock with another */
  compare(other: Clock): Ordering {
    // Compare Clock's counter with another
    if (this.counter > other.counter) return Ordering.Greater;
    if (this.counter < other.counter) return Ordering.Less;

    // If counters are equal, order is determined based on actorId
    // (this is arbitrary, but deterministic)
    if (this.actorId > other.actorId) return Ordering.Greater;
    if (this.actorId < other.actorId) return Ordering.Less;
    return Ordering.Equal;
  }

  /** Stringify the current clock into a comparable string */
  toString(): string {
    const paddedCounter = String(this.counter).padStart(15, "0");
    return `${paddedCounter}:${this.actorId}`;
  }

  /**
   * Used to retreive a value's primitive, used in comparisons
   * @example
   * const clock1 = new Clock('a');
   * const clock2 = new Clock('b');
   * clock1.tick();
   * 
   * // returns true
   * console.log(clock1 > clock2);
   */
  valueOf(): string {
    return this.toString();
  }

  /** Create a Clock from a previously stringified Clock */
  static fromString(string: string): Clock {
    const [counter, actorId] = string.split(":");
    const counterNum = Number(counter);
    return new Clock(actorId, counterNum);
  }
}
