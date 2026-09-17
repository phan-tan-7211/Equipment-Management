import { describe, it, expect } from 'vitest';
import {
  materializeOperatorChecklistStarter,
  OPERATOR_CHECKLIST_STARTER_TEMPLATES,
} from '@/features/operator-check-ins/data/operatorChecklistStarterTemplates';

describe('operatorChecklistStarterTemplates', () => {
  it('includes odometer, FMCSA-style DVIR, and chain conveyor oven starters', () => {
    const ids = OPERATOR_CHECKLIST_STARTER_TEMPLATES.map((starter) => starter.id);
    expect(ids).toContain('starter-odometer-log');
    expect(ids).toContain('starter-fmcsa-dvir');
    expect(ids).toContain('starter-chain-conveyor-oven-daily');
  });

  it('materializes fresh field and item ids on clone', () => {
    const starter = OPERATOR_CHECKLIST_STARTER_TEMPLATES.find((item) => item.id === 'starter-fmcsa-dvir');
    expect(starter).toBeDefined();

    const first = materializeOperatorChecklistStarter(starter!);
    const second = materializeOperatorChecklistStarter(starter!);

    expect(first.templateData.dataFields[0]?.id).not.toBe(starter!.templateData.dataFields[0]?.id);
    expect(first.templateData.checklistItems[0]?.id).not.toBe(starter!.templateData.checklistItems[0]?.id);
    expect(first.templateData.dataFields[0]?.id).not.toBe(second.templateData.dataFields[0]?.id);
    expect(first.name).toBe(starter!.name);
  });

  it('odometer starter requires operator name and odometer number', () => {
    const starter = OPERATOR_CHECKLIST_STARTER_TEMPLATES.find((item) => item.id === 'starter-odometer-log');
    expect(starter).toBeDefined();
    const materialized = materializeOperatorChecklistStarter(starter!);
    const labels = materialized.templateData.dataFields.map((field) => field.label);
    expect(labels).toContain('Your name');
    expect(labels).toContain('Odometer reading');
  });

  it('chain conveyor oven starter keeps the daily pre-start check compact', () => {
    const starter = OPERATOR_CHECKLIST_STARTER_TEMPLATES.find(
      (item) => item.id === 'starter-chain-conveyor-oven-daily',
    );
    expect(starter).toBeDefined();

    const materialized = materializeOperatorChecklistStarter(starter!);
    expect(materialized.templateData.dataFields).toHaveLength(5);
    expect(materialized.templateData.checklistItems).toHaveLength(10);
    expect(materialized.templateData.checklistItems.every((item) => item.required)).toBe(true);

    const labels = materialized.templateData.dataFields.map((field) => field.label);
    expect(labels).toEqual(expect.arrayContaining(['Operator name', 'Equipment name', 'Startup notes / abnormalities']));

    const titles = materialized.templateData.checklistItems.map((item) => item.title);
    expect(titles).toContain(
      'Heating system (coil heater or IR, as fitted) starts normally with no visibly failed or damaged element',
    );
  });
});
