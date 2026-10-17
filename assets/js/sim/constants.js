/**
 * Engineering constants used by the educational simulator.
 * Confirm each selected device's datasheet and the locally adopted standards before field use.
 */
export const ENGINEERING = Object.freeze({
  poe: Object.freeze({\n    // Nominal voltage is a model input only; real PSE/PD voltage depends on class, load and cabling.\n    nominalVoltageV: 48,
    // IEEE 802.3af Type 1: maximum PSE output and minimum power available at PD.
    af: Object.freeze({ label: "IEEE 802.3af / Type 1", pseW: 15.4, pdW: 12.95, pairs: 2 }),
    // IEEE 802.3at Type 2.
    at: Object.freeze({ label: "IEEE 802.3at / Type 2", pseW: 30, pdW: 25.5, pairs: 2 }),
    // IEEE 802.3bt Type 3; check implementation and class-specific limits in the PSE/PD datasheets.
    bt3: Object.freeze({ label: "IEEE 802.3bt / Type 3", pseW: 60, pdW: 51, pairs: 4 }),
    // IEEE 802.3bt Type 4; 90 W PSE / 71.3 W PD are commonly cited maxima, not a promise for every port.
    bt4: Object.freeze({ label: "IEEE 802.3bt / Type 4", pseW: 90, pdW: 71.3, pairs: 4 })
  }),
  ethernet: Object.freeze({
    // ISO/IEC 11801 and ANSI/TIA-568 channel design guidance: 100 m total channel, commonly 90 m permanent link + 10 m patch cords.
    maxCopperChannelM: 100,
    typicalPermanentLinkM: 90,
    typicalPatchCordsTotalM: 10,\n    // Model assumption for a 24-AWG copper loop, not a universal TIA limit; replace with cable datasheet/test values.\n    copperLoopResistanceOhmPerKm: 188,\n    // No universal CCA multiplier exists; 1.575 is a 57.5% planning assumption marked NEEDS_VERIFY.\n    ccaResistanceFactor: 1.575
  }),
  network: Object.freeze({
    // RFC 1918 private IPv4 blocks.
    privateRanges: Object.freeze([
      Object.freeze({ cidr: "10.0.0.0/8", start: 0x0a000000, end: 0x0affffff }),
      Object.freeze({ cidr: "172.16.0.0/12", start: 0xac100000, end: 0xac1fffff }),
      Object.freeze({ cidr: "192.168.0.0/16", start: 0xc0a80000, end: 0xc0a8ffff })
    ]),
    // RFC 3021 allows both addresses of a /31 on point-to-point links.
    rfc3021Prefix: 31,
    linkLocalStart: 0xa9fe0000,
    linkLocalEnd: 0xa9feffff,
    loopbackStart: 0x7f000000,
    loopbackEnd: 0x7fffffff
  }),
  video: Object.freeze({
    // Typical starting points only; scene complexity, FPS, codec profile and vendor implementation can change bitrate substantially.
    bitrateMbps: Object.freeze({ "1080p": Object.freeze({ "H.264": 4, "H.265": 2.5 }), "4MP": Object.freeze({ "H.264": 7, "H.265": 4.5 }), "4K": Object.freeze({ "H.264": 16, "H.265": 10 }) }),\n    // Common starting points for design estimates; tune to frame rate, motion, WDR, noise and vendor encoder.\n    typicalAudioMbps: 0.128,\n    typicalRemoteStreamMbps: 0.5,\n    typicalPtzExtraW: 8,\n    typicalNvrOtherLoadW: 80,\n    // Legacy DORI thresholds from IEC 62676-4:2014/2015; IEC 62676-4:2025 revised the density scale.\n    legacyDori: Object.freeze({ detection: 25, observation: 62.5, recognition: 125, identification: 250 }),\n    currentDensityLevels2025: Object.freeze([20, 40, 80, 125, 250, 500, 1500])
  }),
  design: Object.freeze({
    // Engineering heuristic, not a standard: keep planned sustained uplink use below 70% where feasible.
    uplinkTargetUtilization: 0.70,
    // Design heuristic: reserve 20–30% switch ports for growth; default to 25%.
    defaultPortSpareFraction: 0.25,
    // Educational warning threshold; cable heating depends on bundle, ambient temperature, installation and PoE class.
    highPowerPoeWarningW: 60
  }),
  tools: Object.freeze({\n    // Display noise makes repeated measurements deterministic for a given seed, but does not represent calibrated equipment.\n    meterNoiseFraction: 0.005,\n    cableLengthNoiseFraction: 0.04\n  }),\n  storage: Object.freeze({
    // SI decimal storage: 1 TB = 10^12 bytes; GiB/TiB use powers of 1024.
    bytesPerGB: 1e9,
    bytesPerTB: 1e12,
    bytesPerGiB: 1024 ** 3,
    bytesPerTiB: 1024 ** 4,
    // Planning heuristic only; actual formatted capacity varies by drive, filesystem, RAID and recorder.
    typicalFormattedCapacityFactor: 0.91,
    typicalFilesystemOverheadMin: 0.05,
    typicalFilesystemOverheadMax: 0.10
  })
});
