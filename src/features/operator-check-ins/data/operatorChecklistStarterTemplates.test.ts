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

  it('freezes starter copy in the selected admin language when cloning', () => {
    const starter = OPERATOR_CHECKLIST_STARTER_TEMPLATES.find(
      (item) => item.id === 'starter-chain-conveyor-oven-daily',
    );
    expect(starter).toBeDefined();

    const vi = materializeOperatorChecklistStarter(starter!, 'vi');
    expect(vi.name).toBe('Kiểm tra trước khi khởi động lò băng tải xích hằng ngày');
    expect(vi.templateData.dataFields.map((field) => field.label)).toEqual(
      expect.arrayContaining(['Tên người vận hành', 'Ghi chú khởi động / bất thường', 'Tên thiết bị']),
    );
    expect(vi.templateData.checklistItems[0]?.section).toBe('Băng tải & đường chạy');
    expect(vi.templateData.checklistItems[0]?.title).toBe(
      'Xích chạy tự do, không kẹt, lệch khỏi đường dẫn hoặc chùng bất thường',
    );

    const ko = materializeOperatorChecklistStarter(starter!, 'ko');
    expect(ko.name).toBe('체인 컨베이어 오븐 일일 가동 전 점검');
    expect(ko.templateData.dataFields.map((field) => field.label)).toContain('작업자 이름');
    expect(ko.templateData.checklistItems[0]?.section).toBe('컨베이어 및 이동 경로');

    const en = materializeOperatorChecklistStarter(starter!, 'en');
    expect(en.name).toBe('Chain Conveyor Oven Daily Pre-Start');
    expect(en.templateData.checklistItems[0]?.section).toBe('Conveyor & Path');
  });

  it('localizes every built-in starter while preserving field and item structure', () => {
    for (const starter of OPERATOR_CHECKLIST_STARTER_TEMPLATES) {
      const en = materializeOperatorChecklistStarter(starter, 'en');
      const vi = materializeOperatorChecklistStarter(starter, 'vi');
      const ko = materializeOperatorChecklistStarter(starter, 'ko');

      expect(vi.name).not.toBe('');
      expect(ko.name).not.toBe('');
      expect(vi.templateData.dataFields).toHaveLength(en.templateData.dataFields.length);
      expect(ko.templateData.dataFields).toHaveLength(en.templateData.dataFields.length);
      expect(vi.templateData.checklistItems).toHaveLength(en.templateData.checklistItems.length);
      expect(ko.templateData.checklistItems).toHaveLength(en.templateData.checklistItems.length);
      expect(vi.templateData.dataFields.map((field) => field.source)).toEqual(
        en.templateData.dataFields.map((field) => field.source),
      );
      expect(ko.templateData.checklistItems.map((item) => item.required)).toEqual(
        en.templateData.checklistItems.map((item) => item.required),
      );
    }
  });

});
