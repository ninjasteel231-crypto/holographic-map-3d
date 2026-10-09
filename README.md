# Holographic Map 3D

A small React + Three.js app that turns a 2D map image into a 3D holographic map. The script finds pixels matching a chosen color, lifts those pixels upward, and lets you rotate/manipulate the camera with the mouse.

## Features

- Upload any map image
- Pick a target color
- Adjust color tolerance and buildup height
- Orbit/rotate the camera
- Zoom and pan around the map
- Auto-rotation mode for holographic presentation

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Then open the URL shown in the terminal.

## Production build

```bash
npm run build
```

## Notes

This is a basic but functional version meant to be extended for more advanced effects such as:

- multiple color layers
- glow/neon hologram styling
- different height values per color
- export to GLTF/OBJ
