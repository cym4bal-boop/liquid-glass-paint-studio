import presets from './supplied-brushes.json';
import { registerBrushes } from './brushes';
import { translateCustomJsonBrush, translateMyPaintBrush } from './brush-translator';

/** Imports supported preset properties, not native rendering algorithms. */
export function installSuppliedLibrary() {
  const brushes = presets.map((preset) => {
    const brush = preset.kind === 'mypaint'
      ? translateMyPaintBrush(preset.data, preset.path)
      : translateCustomJsonBrush(preset.data, preset.path.split('/').pop());
    return { ...brush, id: `supplied-${preset.kind}-${preset.path.replace(/[^a-z0-9]/gi, '-')}`,
      category: preset.kind === 'mypaint' ? 'MyPaint' : 'Imported' };
  });
  registerBrushes(brushes);
  return brushes.length;
}