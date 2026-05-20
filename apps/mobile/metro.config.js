// Expo monorepo support — watch packages/shared, resolve hoisted deps from workspace root.
// Required because apps/mobile imports from @biblequize/shared (workspace package).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

const defaultGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (options) => [
  ...defaultGetPolyfills(options),
  path.resolve(projectRoot, "polyfills.js"),
];

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = true;

const webidlConversionsV5 = path.resolve(
  workspaceRoot,
  "node_modules/whatwg-url-without-unicode/node_modules/webidl-conversions/lib/index.js"
);
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "webidl-conversions") {
    return { type: "sourceFile", filePath: webidlConversionsV5 };
  }
  if (typeof upstreamResolveRequest === "function") {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
