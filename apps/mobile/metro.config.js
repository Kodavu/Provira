// Metro config for a pnpm workspace: watch the repo root and let Metro's
// default (hierarchical + symlink-aware) resolution walk pnpm's nested store.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];

module.exports = config;
