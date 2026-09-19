import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TOOL_PRESETS,
  parseToolPresets,
  updateToolPreset,
} from '@/features/facility-map/sketch/persistence/toolPresets';

describe('tool presets', () => {
  it('returns defaults when storage is empty or corrupt', () => {
    expect(parseToolPresets(null)).toEqual(DEFAULT_TOOL_PRESETS);
    expect(parseToolPresets('{broken')).toEqual(DEFAULT_TOOL_PRESETS);
  });

  it('migrates legacy line/rect/circle presets to independent create tools', () => {
    const presets = parseToolPresets(JSON.stringify({
      line: { color: '#111111', lineWidth: 2 },
      rect: { color: '#222222', lineWidth: 3 },
      circle: { color: '#333333', lineWidth: 4 },
    }));

    expect(presets.line).toEqual({ color: '#111111', lineWidth: 2 });
    expect(presets.polyline).toEqual({ color: '#111111', lineWidth: 2 });
    expect(presets.arc).toEqual({ color: '#111111', lineWidth: 2 });
    expect(presets.rect).toEqual({ color: '#222222', lineWidth: 3 });
    expect(presets.circle).toEqual({ color: '#333333', lineWidth: 4 });
  });

  it('preserves independent polyline and arc presets when present', () => {
    const presets = parseToolPresets(JSON.stringify({
      line: { color: '#111111', lineWidth: 1 },
      polyline: { color: '#abcdef', lineWidth: 2 },
      arc: { color: '#fedcba', lineWidth: 3 },
    }));

    expect(presets.polyline).toEqual({ color: '#abcdef', lineWidth: 2 });
    expect(presets.arc).toEqual({ color: '#fedcba', lineWidth: 3 });
  });

  it('updates only the selected tool preset', () => {
    const presets = parseToolPresets(null);
    const updated = updateToolPreset(presets, 'polyline', {
      color: '#123456',
      lineWidth: 4,
    });

    expect(updated.polyline).toEqual({
      color: '#123456',
      lineWidth: 4,
    });
    expect(updated.line).toEqual(presets.line);
    expect(updated.arc).toEqual(presets.arc);
  });
});
