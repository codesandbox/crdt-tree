export enum Ordering {
  Equal,
  Greater,
  Less,
}

/** Implements a Lamport Clock */
export class Clock<Id> {
  actorId: Id;
  counter: number;

  constructor(actorId: Id, counter: number = 0) {
    this.actorId = actorId;
    this.counter = counter;
  }

  /** Returns a new Clock with same actor but counter incremented by 1 */
  inc(): Clock<Id> {
    return new Clock(this.actorId, this.counter + 1);
  }

  /** Increments the clock counter and returns a new Clock */
  tick(): Clock<Id> {
    this.counter += 1;
    return new Clock(this.actorId, this.counter);
  }

  /** Returns a new clock with the same actor but the counter is the larger of the two */
  merge(clock: Clock<Id>): Clock<Id> {
    return new Clock(this.actorId, Math.max(this.counter, clock.counter));
  }

  /** Compare the ordering of the current Clock with another */
  compare(other: Clock<Id>): Ordering {
    // Compare Clock's counter with another
    if (this.counter > other.counter) return Ordering.Greater;
    if (this.counter < other.counter) return Ordering.Less;

    // If counters are equal, order is determined based on actorId
    // (this is arbitrary, but deterministic)
    if (this.actorId > other.actorId) return Ordering.Greater;
    if (this.actorId < other.actorId) return Ordering.Less;
    return Ordering.Equal;
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

  /** Stringify the current clock into a comparable string */
  toString(): string {
    const paddedCounter = String(this.counter).padStart(10, "0");
    return `${paddedCounter}:${this.actorId}`;
  }
}
