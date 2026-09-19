import type {
  SketchCreateTool,
  SketchStyle,
} from '../core/types';

export type ToolPresetMap = Record<SketchCreateTool, SketchStyle>;

export const TOOL_PRESET_STORAGE_KEY =
  'znteqr:facility-sketch:presets:v1';

export const DEFAULT_TOOL_PRESETS: ToolPresetMap = {
  line: { color: '#2563eb', lineWidth: 1.5 },
  polyline: { color: '#2563eb', lineWidth: 1.5 },
  rect: { color: '#7c3aed', lineWidth: 1.5 },
  circle: { color: '#0891b2', lineWidth: 1.5 },
  arc: { color: '#f59e0b', lineWidth: 1.5 },
};

const mergePreset = (
  base: SketchStyle,
  candidate?: Partial<SketchStyle>,
): SketchStyle => ({
  ...base,
  ...(candidate ?? {}),
});

export const parseToolPresets = (
  raw: string | null | undefined,
): ToolPresetMap => {
  if (!raw) return structuredClone(DEFAULT_TOOL_PRESETS);

  try {
    const parsed = JSON.parse(raw) as Partial<ToolPresetMap>;
    return {
      line: mergePreset(DEFAULT_TOOL_PRESETS.line, parsed.line),
      polyline: mergePreset(
        DEFAULT_TOOL_PRESETS.polyline,
        parsed.polyline ?? parsed.line,
      ),
      rect: mergePreset(DEFAULT_TOOL_PRESETS.rect, parsed.rect),
      circle: mergePreset(DEFAULT_TOOL_PRESETS.circle, parsed.circle),
      arc: mergePreset(
        DEFAULT_TOOL_PRESETS.arc,
        parsed.arc ?? parsed.line,
      ),
    };
  } catch {
    return structuredClone(DEFAULT_TOOL_PRESETS);
  }
};

export const updateToolPreset = (
  presets: ToolPresetMap,
  tool: SketchCreateTool,
  patch: Partial<SketchStyle>,
): ToolPresetMap => ({
  ...presets,
  [tool]: {
    ...presets[tool],
    ...patch,
  },
});
