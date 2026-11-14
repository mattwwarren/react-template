import assert from "node:assert/strict";
import { test } from "node:test";
import { allowlistProblems } from "../lib/axe-allowlist-shape.mjs";

const ENTRY = { label: "main", id: "color-contrast", target: "#a" };

test("an empty list and a well-formed list have no problems", () => {
  assert.deepEqual(allowlistProblems([]), []);
  assert.deepEqual(allowlistProblems([ENTRY, { ...ENTRY, target: "#b" }]), []);
});
test("anything that is not an array is a problem", () => {
  for (const bad of [{}, null, "x", 3, undefined]) assert.match(allowlistProblems(bad)[0], /must be a JSON array/);
});
test("a null element is reported by index", () => {
  const p = allowlistProblems([ENTRY, null]);
  assert.equal(p.length, 1);
  assert.match(p[0], /element 1/);
  assert.match(p[0], /plain object/);
});
test("string, number and nested-array elements are not plain objects", () => {
  for (const bad of ["x", 7, [ENTRY]]) assert.match(allowlistProblems([bad])[0], /element 0.*plain object/);
});
test("a missing, empty or non-string field is reported by name", () => {
  const noTarget = { label: ENTRY.label, id: ENTRY.id };
  assert.match(allowlistProblems([noTarget])[0], /element 0.*"target"/);
  assert.match(allowlistProblems([{ ...ENTRY, label: "" }])[0], /element 0.*"label"/);
  assert.match(allowlistProblems([{ ...ENTRY, id: 5 }])[0], /element 0.*"id"/);
});
test('a label or id containing "|" is rejected (allowKey joins on it); a target may contain it', () => {
  assert.match(allowlistProblems([{ ...ENTRY, label: "a|b" }])[0], /element 0.*"label".*"\|"/);
  assert.match(allowlistProblems([{ ...ENTRY, id: "x|y" }])[0], /element 0.*"id".*"\|"/);
  assert.deepEqual(allowlistProblems([{ ...ENTRY, target: "a[href|='x']" }]), []);
});
test("every problem is listed: one per bad element, one per missing field", () => {
  // null, "x", then an object missing both "id" and "target"
  assert.equal(allowlistProblems([null, "x", { label: "a" }]).length, 4);
});
