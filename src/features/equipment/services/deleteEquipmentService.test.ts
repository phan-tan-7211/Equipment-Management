import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockFrom, mockRpc, mockRemove } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    storage: { from: () => ({ remove: (...args: unknown[]) => mockRemove(...args) }) },
  },
}));

vi.mock('@/services/imageUploadService', () => ({
  normalizeStoredObjectPath: (url: string) => url,
}));

vi.mock('@/services/displayImageStorageService', () => ({
  isDisplayImageV2Ref: vi.fn(() => false),
  removeDisplayImageSet: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { deleteEquipmentCascade } = await import('./deleteEquipmentService');

const ORG_ID = 'org-1';
const EQUIP_ID = 'eq-1';

/** Build a thenable Supabase query chain that resolves to `result`. */
function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  chain.select = vi.fn(ret);
  chain.eq = vi.fn(ret);
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  return chain;
}

describe('deleteEquipmentCascade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => makeChain({ data: { image_url: null }, error: null }));
    mockRemove.mockResolvedValue({ error: null });
  });

  it('runs the server-side cascade and removes returned note images from storage', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, note_image_paths: ['u1/note/a.jpg', 'u2/note/b.jpg'] },
      error: null,
    });

    await expect(deleteEquipmentCascade(EQUIP_ID, ORG_ID)).resolves.toBeUndefined();

    expect(mockRpc).toHaveBeenCalledWith('delete_equipment_cascade', { p_equipment_id: EQUIP_ID });
    expect(mockRemove).toHaveBeenCalledWith(['u1/note/a.jpg']);
    expect(mockRemove).toHaveBeenCalledWith(['u2/note/b.jpg']);
  });

  it('surfaces a permission denial from the database', async () => {
    mockRpc.mockResolvedValue({ data: { success: false, error: 'Permission denied' }, error: null });

    await expect(deleteEquipmentCascade(EQUIP_ID, ORG_ID)).rejects.toThrow('Permission denied');
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('surfaces RPC transport errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'network' } });

    await expect(deleteEquipmentCascade(EQUIP_ID, ORG_ID)).rejects.toMatchObject({ message: 'network' });
  });
});
