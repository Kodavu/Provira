# Mobile app assets

The `.svg` files are the editable **sources**; the `.png` files are what Expo
actually ships (referenced from `app.json`). Regenerate the PNGs whenever a
source changes.

| Source | PNG | Size | Background | Used by |
|--------|-----|------|-----------|---------|
| `icon.svg` | `icon.png` | 1024×1024 | opaque indigo | iOS/Android app icon, web favicon |
| `adaptive-icon.svg` | `adaptive-icon.png` | 1024×1024 | transparent | Android adaptive foreground (indigo comes from `adaptiveIcon.backgroundColor`) |
| `splash.svg` | `splash.png` | 1200×1200 | transparent | splash (indigo comes from `splash.backgroundColor`) |

The mark is the Provira logomark: a white checkmark with a rising gold tip
(`#f5b301`) on the indigo brand (`#3d3bf3` → `#2725b0`).

## Regenerate the PNGs

Any SVG→PNG rasterizer works. With `rsvg-convert`:

```sh
rsvg-convert -w 1024 -h 1024 icon.svg          -o icon.png
rsvg-convert -w 1024 -h 1024 adaptive-icon.svg -o adaptive-icon.png
rsvg-convert -w 1200 -h 1200 splash.svg        -o splash.png
```

Keep the icon opaque and the adaptive-icon / splash transparent.
