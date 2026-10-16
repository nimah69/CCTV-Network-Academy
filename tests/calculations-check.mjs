import assert from "node:assert/strict";
import calc from "../js/calculations.js";

const poe = calc.poe(12, 9, 25);
assert.equal(poe.base, 108);
assert.equal(poe.total, 135);
assert.throws(() => calc.poe("", 9, 25), /خالی/);
assert.throws(() => calc.poe(0, 9, 25), /بزرگ‌تر از صفر/);
assert.throws(() => calc.poe(-1, 9, 25), /بزرگ‌تر از صفر/);
assert.throws(() => calc.poe(1.5, 9, 25), /عدد صحیح/);
assert.throws(() => calc.poe(2, 9, 101), /۱۰۰/);
assert.throws(() => calc.poe(2, Number.NaN, 25), /عدد معتبر/);

const subnet = calc.subnet("192.168.10.25", "24");
assert.equal(subnet.networkText, "192.168.10.0");
assert.equal(subnet.maskText, "255.255.255.0");
assert.equal(subnet.broadcastText, "192.168.10.255");
assert.equal(subnet.firstText, "192.168.10.1");
assert.equal(subnet.lastText, "192.168.10.254");
assert.equal(subnet.hostCount, 254);
assert.equal(calc.subnet("0.0.0.1", 0).networkText, "0.0.0.0");
assert.equal(calc.subnet("192.168.1.2", 31).hostCount, 2);
assert.equal(calc.subnet("192.168.1.2", 32).hostCount, 1);
for (const badIp of ["", "1.2.3", "1.2.3.256", "1.2.3.x", "1..3.4", "  "]) {
  assert.throws(() => calc.subnet(badIp, 24), /IPv4/);
}
for (const badCidr of ["", -1, 33, 24.5, "abc"]) {
  assert.throws(() => calc.subnet("192.168.1.1", badCidr));
}
assert.throws(() => calc.ipv4ToNumber("1.2.3.999"));
const referenceStorage = calc.storage(12, 4, 14, 0, 24, 0);
assert.ok(Math.abs(referenceStorage.tb - 7.2576) < 1e-9, "12 cameras × 4 Mbps × 24 h × 14 days should be about 7.26 decimal TB");
const scheduledStorage = calc.storage(8, 4, 14, 10, 12, 5);
assert.ok(Math.abs(scheduledStorage.tb - 2.4192) < 1e-9);
assert.ok(Math.abs(scheduledStorage.withHeadroom - 2.794176) < 1e-9);
assert.equal(scheduledStorage.hoursPerDay, 12);
assert.equal(scheduledStorage.overheadPercent, 5);
assert.throws(() => calc.storage(8, 4, 14, 10, 0, 0), /بزرگ‌تر از صفر/);
assert.throws(() => calc.storage(8, 4, 14, 10, 25, 0), /۲۴/);
assert.throws(() => calc.storage(8, 4, 14, 10, 12, 101), /۱۰۰/);

assert.throws(() => calc.ipv4ToNumber("1.2.3.4.5"));

console.log("Calculation checks passed: PoE validation, IPv4 parsing, subnet boundaries and invalid-input cases.");
