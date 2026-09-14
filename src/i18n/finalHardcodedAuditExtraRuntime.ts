import { resolveRuntimeLanguage } from '@/i18n/finalHardcodedAuditRuntime';
import { getFinalHardcodedAuditExtraCopy } from '@/i18n/finalHardcodedAuditExtraCopy';

export function getRuntimeFinalHardcodedAuditExtraCopy() {
  return getFinalHardcodedAuditExtraCopy(resolveRuntimeLanguage());
}
