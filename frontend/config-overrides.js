const webpack = require("webpack");
const getCacheIdentifier = require("react-dev-utils/getCacheIdentifier");

module.exports = function override(config, webpackEnv) {
  console.log("Overriding webpack config...");

  // Set up environment flags
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";
  const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

  // Configure fallbacks for Node environment
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify"),
    url: require.resolve("url"),
    zlib: require.resolve("browserify-zlib"),
    tty: require.resolve("tty-browserify"),
    fs: false,
    vm: false,
  });
  config.resolve.fallback = fallback;

  // Configure plugins
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);

  // Ignore certain warnings
  config.ignoreWarnings = [/Failed to parse source map/];

  // Add source-map loader
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: "pre",
    loader: require.resolve("source-map-loader"),
    resolve: {
      fullySpecified: false,
    },
  });

  // Modify Babel loader configuration
  const loaders = config.module.rules.find((rule) =>
    Array.isArray(rule.oneOf)
  ).oneOf;
  loaders.splice(loaders.length - 1, 0, {
    test: /\.(js|mjs|cjs)$/,
    exclude: /@babel(?:\/|\\{1,2})runtime/,
    loader: require.resolve("babel-loader"),
    options: {
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [
        [
          require.resolve("babel-preset-react-app/dependencies"),
          { helpers: true },
        ],
      ],
      cacheDirectory: true,
      cacheCompression: false,
      cacheIdentifier: getCacheIdentifier(
        isEnvProduction ? "production" : isEnvDevelopment && "development",
        [
          "babel-plugin-named-asset-import",
          "babel-preset-react-app",
          "react-dev-utils",
          "react-scripts",
        ]
      ),
      sourceMaps: shouldUseSourceMap,
      inputSourceMap: shouldUseSourceMap,
    },
  });

  return config;
};