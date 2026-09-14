import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotesVisibilityFilter from './NotesVisibilityFilter';
import { NotePresentationI18nProvider } from './NotePresentationI18nProvider';
import { workOrderTimelineNoteResources } from '@/i18n/workOrderTimelineNoteResources';

const translateVi = (key: string) => {
  const name = key.replace('workOrderTimelineNote.', '');
  return (workOrderTimelineNoteResources.vi.workOrderTimelineNote as Record<string, string>)[name] ?? key;
};

describe('opt-in note presentation translations', () => {
  it('preserves English defaults for note consumers outside Work Orders', () => {
    render(<NotesVisibilityFilter value="all" onChange={() => undefined} />);
    expect(screen.getByRole('combobox', { name: 'Filter notes by visibility' })).toBeInTheDocument();
  });

  it('localizes shared note controls within Work Orders scope', () => {
    render(
      <NotePresentationI18nProvider t={translateVi}>
        <NotesVisibilityFilter value="all" onChange={() => undefined} />
      </NotePresentationI18nProvider>,
    );
    expect(screen.getByRole('combobox', { name: 'Lọc ghi chú theo quyền xem' })).toBeInTheDocument();
  });
});
