import { Clock } from "..";

test("valueOf comparison", () => {
  const clock1 = new Clock("a");
  const clock2 = new Clock("b");

  expect(clock1 < clock2).toBe(true);

  clock1.tick();

  expect(clock1 < clock2).toBe(false);
});
