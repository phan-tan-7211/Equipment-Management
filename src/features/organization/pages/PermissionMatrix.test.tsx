import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PermissionMatrix from './PermissionMatrix';
import { PERMISSION_MATRIX, PERMISSION_MATRIX_ROLES, permissionMatrixCopy } from '../permissions/permissionMatrix';

const organizationState = vi.hoisted(() => ({ current: null as null | { id: string; userRole: string } }));

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => ({ currentOrganization: organizationState.current }),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({ language: 'en' }),
}));

vi.mock('@/features/organization/components/OrganizationSubnav', () => ({
  OrganizationSubnav: () => null,
}));

vi.mock('../permissions/TeamPermissionSettings', () => ({
  TeamPermissionSettings: ({ canEdit }: { canEdit: boolean }) => <div>{canEdit ? 'Settings editable' : 'Settings read-only'}</div>,
}));

describe('PermissionMatrix', () => {
  beforeEach(() => {
    organizationState.current = { id: 'org-1', userRole: 'owner' };
  });

  it('shows every role column and permission row to owners', () => {
    render(<PermissionMatrix />);

    expect(screen.getByRole('heading', { name: 'Permission matrix' })).toBeInTheDocument();
    for (const role of PERMISSION_MATRIX_ROLES) {
      expect(screen.getByRole('columnheader', { name: permissionMatrixCopy.en.roles[role] })).toBeInTheDocument();
    }
    const rowCount = PERMISSION_MATRIX.reduce((total, section) => total + section.rows.length, 0);
    // One row header per permission plus one per section heading.
    expect(screen.getAllByRole('rowheader')).toHaveLength(rowCount + PERMISSION_MATRIX.length);
  });

  it('labels each cell with the role and decision for screen readers', () => {
    render(<PermissionMatrix />);

    const deleteRow = screen.getByRole('rowheader', { name: 'Delete organization' }).closest('tr')!;
    expect(deleteRow.querySelector('[aria-label="Owner: Allowed"]')).not.toBeNull();
    expect(deleteRow.querySelector('[aria-label="Admin: Not allowed"]')).not.toBeNull();
  });

  it('is available to admins with read-only custom settings', () => {
    organizationState.current = { id: 'org-1', userRole: 'admin' };
    render(<PermissionMatrix />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Settings read-only')).toBeInTheDocument();
  });

  it('lets owners edit custom settings', () => {
    render(<PermissionMatrix />);

    expect(screen.getByText('Settings editable')).toBeInTheDocument();
  });

  it.each(['member', 'viewer', 'requestor'])('denies the %s role', (userRole) => {
    organizationState.current = { id: 'org-1', userRole };
    render(<PermissionMatrix />);

    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('filters rows by permission name and keeps whole sections when the section matches', () => {
    render(<PermissionMatrix />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search permissions' }), { target: { value: 'qr' } });
    expect(screen.getByRole('rowheader', { name: /^Generate QR codes/ })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Delete organization' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search permissions' }), { target: { value: 'audit log' } });
    expect(screen.getByRole('rowheader', { name: 'View audit log' })).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', () => {
    render(<PermissionMatrix />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search permissions' }), { target: { value: 'zzz' } });
    expect(screen.getByText('No permissions match your search.')).toBeInTheDocument();
  });

  it('has a translation for every role, section, action and note in every language', () => {
    for (const copy of Object.values(permissionMatrixCopy)) {
      for (const section of PERMISSION_MATRIX) {
        expect(copy.sections[section.id]).toBeTruthy();
        for (const row of section.rows) {
          expect(copy.actions[row.id]).toBeTruthy();
          if (row.note) expect(copy.notes[row.note]).toBeTruthy();
        }
      }
      for (const role of PERMISSION_MATRIX_ROLES) expect(copy.roles[role]).toBeTruthy();
    }
  });
});
