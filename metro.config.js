const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block:
//   - pnpm temp files that crash Metro's file watcher during install
//   - api/ — Phase 2 Next.js backend (runs separately on port 3001). Metro would
//     otherwise try to bundle mongoose/bcryptjs/jsonwebtoken as RN modules and crash.
// Do NOT block the entire .pnpm/ directory — pnpm stores real packages there.
//
// shared/ is INTENTIONALLY UNBLOCKED. The canonical zod schema barrel
// (shared/schemas.ts) is emitted there by canonical-templates-mobile-schemas.ts
// for Phase 2 mobile projects with at least one entity. Screens import
// from 'shared/schemas' to validate forms before submission. The barrel uses
// only zod (which is safe to bundle for RN); api/ is the dangerous side
// because it pulls mongoose + bcryptjs which Metro can't transform.
const escapedRoot = __dirname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  /node_modules\/\.pnpm\/.*\/_tmp\/.*/,
  new RegExp(`^${escapedRoot}/api/.*`),
];

module.exports = config;
