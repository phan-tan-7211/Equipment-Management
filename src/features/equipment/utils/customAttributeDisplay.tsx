import React from 'react';
import { humanizeAttributeValue } from '@/features/work-orders/utils/workOrderHelpers';

const DANGEROUS_PROTOCOLS_REGEX = /^(javascript|data|vbscript):/i;

type Translate = (key: string) => string;

const CUSTOM_ATTRIBUTE_LABEL_KEYS: Record<string, string> = {
  origin: 'equipmentCustomAttributes.attributeLabels.origin',
  migration: 'equipmentCustomAttributes.attributeLabels.migration',
  criticality: 'equipmentCustomAttributes.attributeLabels.criticality',
  'current area': 'equipmentCustomAttributes.attributeLabels.currentArea',
  'current line': 'equipmentCustomAttributes.attributeLabels.currentLine',
  'registered at': 'equipmentCustomAttributes.attributeLabels.registeredAt',
  'registered by': 'equipmentCustomAttributes.attributeLabels.registeredBy',
  'source qr code': 'equipmentCustomAttributes.attributeLabels.sourceQrCode',
  'criticality rule': 'equipmentCustomAttributes.attributeLabels.criticalityRule',
  'using department': 'equipmentCustomAttributes.attributeLabels.usingDepartment',
  'criticality facts': 'equipmentCustomAttributes.attributeLabels.criticalityFacts',
  'equipment category': 'equipmentCustomAttributes.attributeLabels.equipmentCategory',
  'managing department': 'equipmentCustomAttributes.attributeLabels.managingDepartment',
  'source equipment id': 'equipmentCustomAttributes.attributeLabels.sourceEquipmentId',
  'source control number': 'equipmentCustomAttributes.attributeLabels.sourceControlNumber',
};

const normalizeCustomAttributeKey = (key: string): string =>
  key.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();

export function getCustomAttributeLabelKey(key: string): string | undefined {
  return CUSTOM_ATTRIBUTE_LABEL_KEYS[normalizeCustomAttributeKey(key)];
}

export function getLocalizedCustomAttributeKey(key: string, t: Translate): string {
  const translationKey = getCustomAttributeLabelKey(key);
  return translationKey ? t(translationKey) : humanizeCustomAttributeKey(key);
}

export function stringifyCustomAttributeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function humanizeCustomAttributeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const isUrl = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (DANGEROUS_PROTOCOLS_REGEX.test(trimmed)) return false;
  const urlPattern = /^(https?:\/\/|www\.)[\w-]+(\.[\w-]+)+([\w\-.,@?^=%&:/~+#]*[\w-@?^=%&/~+#])?$/i;
  return urlPattern.test(trimmed);
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (DANGEROUS_PROTOCOLS_REGEX.test(trimmed)) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('www.')) return `https://${trimmed}`;
  return trimmed;
};

function renderScalarCustomAttributeValue(value: unknown, t?: Translate): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return t?.('equipmentCustomAttributes.emptyValue') ?? '—';
  }

  if (typeof value === 'boolean') {
    return t?.(value ? 'equipmentCustomAttributes.trueValue' : 'equipmentCustomAttributes.falseValue') ?? String(value);
  }

  const text = String(value);
  if (isUrl(text)) {
    const url = normalizeUrl(text);
    if (!DANGEROUS_PROTOCOLS_REGEX.test(url)) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary hover:underline"
          aria-label={`${text} (opens in new tab)`}
        >
          {text}
        </a>
      );
    }
  }

  return humanizeAttributeValue(text);
}

function renderStructuredCustomAttributeValue(value: Record<string, unknown>, t?: Translate): React.ReactNode {
  const entries = Object.entries(value);
  if (entries.length === 0) return t?.('equipmentCustomAttributes.emptyValue') ?? '—';

  return (
    <dl className="max-w-full space-y-1 text-sm leading-5">
      {entries.map(([key, nestedValue]) => (
        <div key={key} className="min-w-0">
          <dt className="inline font-medium text-muted-foreground">{humanizeCustomAttributeKey(key)}: </dt>
          <dd className="inline break-words">
            {nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)
              ? stringifyCustomAttributeValue(nestedValue)
              : renderScalarCustomAttributeValue(nestedValue, t)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function renderCustomAttributeValue(value: unknown, t?: Translate): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <div className="text-lg break-all">{t?.('equipmentCustomAttributes.emptyValue') ?? '—'}</div>;
  }

  if (typeof value === 'boolean') {
    return <div className="text-lg break-all">{t?.(value ? 'equipmentCustomAttributes.trueValue' : 'equipmentCustomAttributes.falseValue') ?? String(value)}</div>;
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return <div className="whitespace-pre-wrap break-words text-sm leading-5">{stringifyCustomAttributeValue(value)}</div>;
    }
    return <div className="max-w-full break-words">{renderStructuredCustomAttributeValue(value as Record<string, unknown>, t)}</div>;
  }

  const text = stringifyCustomAttributeValue(value);
  if (isUrl(text)) {
    const url = normalizeUrl(text);
    if (DANGEROUS_PROTOCOLS_REGEX.test(url)) {
      return <div className="whitespace-pre-wrap break-words text-lg">{text}</div>;
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg break-all text-primary hover:underline"
        aria-label={`${text} (opens in new tab)`}
      >
        {text}
      </a>
    );
  }
  return <div className="whitespace-pre-wrap break-words text-lg">{humanizeAttributeValue(text)}</div>;
}
