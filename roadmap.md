# AeternumPaint migration + fix roadmap

Source: github.com/cym4bal-boop/AeternumPaint (imported 2026-11-01). App code now lives in `src/components/paint/*`, styles in `src/styles.css`, mounted at `/` via `ClientOnly`.

## Migration
- [x] Copy app into TanStack Start project, install deps (ag-psd, jszip, motion, vaul)
- [x] Route `/` + head metadata + fonts + body overflow lock
- [ ] Verify app runs (build OK; browser check pending) in preview (gallery, canvas, drawing)

## Fixes (from user)
- [x] 1. Accent colour swatches + toolbar colour circle: remove ugly outlines
- [x] 2. Undo history: actually works, longer (10000), saved per canvas, never cleared
- [x] 3. Hide colour-drop threshold bar entirely
- [x] 4. Layers toolbar icon: remove outline on top box, "erase" separation between boxes
- [x] 5. Layers menu: rounded boxes matching Procreate aesthetic
- [x] 6. Canvas select: reuse layer-style tick boxes instead of round tick boxes
- [x] 7. Colours not rendering: colour history, toolbar colour icon, accent swatches
- [x] 8. Layer bar "..." menu: options centered → fix alignment
- [x] 9. Sliders missing liquid glass style — make consistent
- [ ] 10. Remake entire brush editor
- [x] 11. Toggles: on-state should not flood whole row with accent colour
- [x] 12. Edge detection toggle: proper visual feedback
- [x] 13. Gallery settings button inconsistent with select/import/new-canvas bar
