const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  setupFiles: ["<rootDir>/jest.setup.ts"],
  // dist contiene copias compiladas de los tests y sus mocks no funcionan ahí.
  // Solo se prueba el código fuente de src.
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};