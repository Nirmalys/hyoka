const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.[fullhash].js",
    chunkFilename: "[name].[fullhash].bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "auto",
    clean: {
      keep: /hyoka\.css/,
    },
    library: {
      type: "window",
      name: "hyoka",
    },
  },
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    "react-dom/client": "ReactDOM",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              [
                "@babel/preset-react",
                {
                  runtime: "automatic",
                  importSource: "react",
                },
              ],
            ],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                {
                  runtime: "automatic",
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            resourceQuery: /inline/,
            type: "asset/source",
          },
          {
            type: "asset/resource",
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: "asset/resource",
      },
      {
        // Inline so offline / connection-error UI can still show the image.
        test: /\.webp$/i,
        type: "asset/inline",
      },
    ],
  },
  optimization: {
    chunkIds: "deterministic",
    splitChunks: {
      chunks: "async",
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          enforce: true,
        },
      },
    },
  },
};