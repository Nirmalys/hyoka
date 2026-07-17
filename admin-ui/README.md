# Hyoka admin UI

Human-readable React / JavaScript source for the Hyoka WordPress admin interface.

Production assets are built into `dist/` and shipped with the plugin. Source maps are not included in the release package; this source tree is the human-readable counterpart required by WordPress.org Plugin Guideline 4.

## Requirements

* Node.js 18+ (LTS recommended)
* npm

## Build

```bash
cd admin-ui
npm install
npm run build
```

Running `npm run build` generates the production assets placed in `admin-ui/dist/` (hashed `bundle.*.js` / `*.bundle.js` files and `hyoka.css`). Those are the files included in the WordPress plugin release.

## Source layout

| Path | Purpose |
|------|---------|
| `src/` | Human-readable application source |
| `src/index.js` | Webpack entry |
| `src/App.js` | App root |
| `src/hyoka.css` | Tailwind / plugin styles entry |
| `package.json` | Dependencies and scripts |
| `webpack.config.js` | Webpack configuration |
| `postcss.config.js` | PostCSS configuration |
| `tailwind.config.js` | Tailwind CSS configuration |

## Public repository

https://github.com/Nirmalys/hyoka
