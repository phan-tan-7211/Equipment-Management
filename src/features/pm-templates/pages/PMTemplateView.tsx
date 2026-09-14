// fallow-ignore-file code-duplication
// Duplication rationale: Read-only template view intentionally parallels editor compatibility UI
import { useI18n } from '@/i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePMTemplate, useClonePMTemplate } from '@/features/pm-templates/hooks/usePMTemplates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/layout/PageHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PMTemplateEquipmentAssignmentMenu } from '@/features/pm-templates/components/PMTemplateEquipmentAssignmentMenu';
import { PMTemplateSectionToc } from '@/features/pm-templates/components/PMTemplateSectionToc';
import { PMTemplateCompatibilityRulesEditor } from '@/features/pm-templates/components/PMTemplateCompatibilityRulesEditor';
import { PMChecklistItem } from '@/features/pm-templates/services/preventativeMaintenanceService';
import { groupChecklistItemsBySection } from '@/utils/pmChecklistHelpers';
import { Copy, Download, Edit, Globe, Lock, Loader2, Save, Shield } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSimplifiedOrganizationRestrictions } from '@/features/organization/hooks/useSimplifiedOrganizationRestrictions';
import { generateTemplatePreviewPDF } from '@/utils/templatePDF';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  usePMTemplateCompatibilityRules, 
  useBulkSetPMTemplateRules 
} from '@/features/pm-templates/hooks/usePMTemplateCompatibility';
import type { PMTemplateCompatibilityRuleFormData } from '@/features/pm-templates/types/pmTemplateCompatibility';

const groupBySection = (items: PMChecklistItem[]) => {
  const groups = groupChecklistItemsBySection(items);
  // Preserve original section order based on first occurrence in the input
  const sectionOrder: string[] = [];
  for (const item of items) {
    if (!sectionOrder.includes(item.section)) sectionOrder.push(item.section);
  }
  return sectionOrder.map((name) => ({ name, items: groups[name] }));
};

const PMTemplateView: React.FC = () => {
  const { t, language } = useI18n();
  const dateLocale = { vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' }[language];
  const { templateId = '' } = useParams();
  const navigate = useNavigate();
  const { data: template, isLoading } = usePMTemplate(templateId);
  const cloneTemplate = useClonePMTemplate();
  const { currentOrganization } = useOrganization();
  const { hasRole } = usePermissions();
  const { restrictions } = useSimplifiedOrganizationRestrictions();

  const [expanded, setExpanded] = useState<string[]>([]);
  const [includeHandwriting, setIncludeHandwriting] = useState(false);
  const [linesPerItem, setLinesPerItem] = useState(5);

  // Compatibility rules state
  const { data: savedRules = [], isLoading: isLoadingRules } = usePMTemplateCompatibilityRules(templateId);
  const bulkSetRules = useBulkSetPMTemplateRules();
  const [editedRules, setEditedRules] = useState<PMTemplateCompatibilityRuleFormData[]>([]);
  const [hasRulesChanges, setHasRulesChanges] = useState(false);

  // Initialize edited rules from saved rules
  useEffect(() => {
    if (savedRules.length > 0) {
      setEditedRules(savedRules.map(r => ({ manufacturer: r.manufacturer, model: r.model })));
      setHasRulesChanges(false);
    } else {
      setEditedRules([]);
      setHasRulesChanges(false);
    }
  }, [savedRules]);

  const handleRulesChange = (newRules: PMTemplateCompatibilityRuleFormData[]) => {
    setEditedRules(newRules);
    setHasRulesChanges(true);
  };

  const handleSaveRules = async () => {
    if (!templateId) return;
    await bulkSetRules.mutateAsync({ templateId, rules: editedRules });
    setHasRulesChanges(false);
  };

  const sections = useMemo(() => {
    const data = Array.isArray(template?.template_data) ? (template?.template_data as PMChecklistItem[]) : [];
    return groupBySection(data);
  }, [template?.template_data]);

  const totalItems = useMemo(() => template?.template_data?.length || 0, [template]);

  const handleBack = () => navigate('/dashboard/pm-templates');
  const handleClone = async () => {
    if (!template?.id) return;
    await cloneTemplate.mutateAsync({ sourceId: template.id, newName: `${template.name} (Copy)` });
  };
  const handleEdit = () => {
    if (!template?.id) return;
    navigate(`/dashboard/pm-templates/${template.id}/edit`);
  };

  const handleTocSectionClick = (sectionName: string) => {
    setExpanded((prev) => Array.from(new Set([...prev, sectionName])));
  };

  const isOrgTemplate = !!template?.organization_id;
  const isAdmin = hasRole(['owner', 'admin']);
  const canCreateCustomTemplates = restrictions.canCreateCustomPMTemplates;
  const canEdit = isOrgTemplate && !template?.is_protected && isAdmin && canCreateCustomTemplates;

  const expandAll = () => setExpanded(sections.map((s) => s.name));
  const collapseAll = () => setExpanded([]);

  useEffect(() => {
    setExpanded([]);
  }, [templateId]);

  const onDownloadPDF = async () => {
    if (!template) return;
    await generateTemplatePreviewPDF({
      name: template.name,
      description: template.description || undefined,
      sections,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      options: { 
        includeHandwritingLines: includeHandwriting, 
        linesPerItem: includeHandwriting ? linesPerItem : 0
      }
    });
  };

  return (
    <div className="space-y-6 p-content">
      {!currentOrganization && (
        <Card className="p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{t('pmTemplates.list.title')}</h1>
            <p className="text-muted-foreground">{t('pmTemplates.list.selectOrganization')}</p>
          </div>
        </Card>
      )}
      {currentOrganization && !isAdmin && (
        <Card className="p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{t('pmTemplates.list.title')}</h1>
            <p className="text-muted-foreground">{t('pmTemplates.list.adminRequired')}</p>
          </div>
        </Card>
      )}
      {(!currentOrganization || !isAdmin) && null}
      <PageHeader
        density="compact"
        title={template?.name || t('pmTemplates.view.template')}
        description={template?.description || undefined}
        breadcrumbs={[
          { label: t('dashboard.title'), href: '/dashboard' },
          { label: t('pmTemplates.list.title'), href: '/dashboard/pm-templates' },
          { label: template?.name || t('pmTemplates.view.view') }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>{t('pmTemplates.view.back')}</Button>
            {canEdit && (
              <Button
                variant="outline"
                onClick={handleEdit}
                aria-label={template ? t('pmTemplates.view.editTemplate', { name: template.name }) : t('pmTemplates.view.editTemplateGeneric')}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('pmTemplates.view.edit')}
              </Button>
            )}
          </div>
        }
      />

      {isLoading && (
        <Card className="p-6">
          <div className="animate-pulse h-6 w-1/3 bg-muted rounded mb-4" />
          <div className="animate-pulse h-4 w-2/3 bg-muted rounded mb-2" />
          <div className="animate-pulse h-4 w-1/2 bg-muted rounded" />
        </Card>
      )}

      {!isLoading && template === null && (
        <Card className="p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{t('pmTemplates.view.notFound')}</h2>
            <p className="text-muted-foreground">{t('pmTemplates.view.notFoundDetail')}</p>
            <div className="pt-2">
              <Button variant="outline" onClick={handleBack}>{t('pmTemplates.view.back')}</Button>
            </div>
          </div>
        </Card>
      )}

      {template && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <PMTemplateSectionToc
              sections={sections.map((s) => ({ name: s.name, count: s.items.length }))}
              onSectionClick={handleTocSectionClick}
              showExpandCollapse
              onExpandAll={expandAll}
              onCollapseAll={collapseAll}
              expandedCount={expanded.length}
            />
          </div>

          {/* Main content */}
          <div className="lg:col-span-9 space-y-4">
            <div className="flex flex-wrap gap-2">
              {!isOrgTemplate && (
                <Badge><Globe className="h-3 w-3 mr-1" />EquipQR</Badge>
              )}
              {isOrgTemplate && (
                <Badge variant="secondary">{t('pmTemplates.view.organization')}</Badge>
              )}
              {template.is_protected && (
                <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />{t('pmTemplates.view.protected')}</Badge>
              )}
              {!canEdit && isOrgTemplate && (
                <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />{t('pmTemplates.view.readOnly')}</Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <span>{t('pmTemplates.view.created', { date: new Date(template.created_at).toLocaleString(dateLocale) })}</span>
              <span className="mx-2">•</span>
              <span>{t('pmTemplates.view.updated', { date: new Date(template.updated_at).toLocaleString(dateLocale) })}</span>
              <span className="mx-2">•</span>
              <span>{t('pmTemplates.view.sections', { count: sections.length })}</span>
              <span className="mx-2">•</span>
              <span>{t('pmTemplates.view.totalItems', { count: totalItems })}</span>
            </div>

            {/* PDF Download Options */}
            <Card>
              <CardContent standalone>
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-handwriting"
                      checked={includeHandwriting}
                      onCheckedChange={(checked) => setIncludeHandwriting(checked as boolean)}
                    />
                    <Label htmlFor="include-handwriting" className="text-sm font-normal cursor-pointer">
                      {t('pmTemplates.view.handwriting')}
                    </Label>
                  </div>
                  
                  {includeHandwriting && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="lines-per-item" className="text-sm whitespace-nowrap">
                        {t('pmTemplates.view.linesPerItem')}
                      </Label>
                      <Input
                        id="lines-per-item"
                        type="number"
                        min={1}
                        max={10}
                        value={linesPerItem}
                        onChange={(e) => setLinesPerItem(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                        className="w-20"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 sm:ml-auto">
                    <PMTemplateEquipmentAssignmentMenu
                      templateId={template.id}
                      templateName={template.name}
                    />
                    <Button variant="outline" onClick={handleClone} disabled={!canCreateCustomTemplates} title={!canCreateCustomTemplates ? t('pmTemplates.view.licenseRequired') : ''}>
                      <Copy className="mr-2 h-4 w-4" />
                      {t('pmTemplates.view.clone')}
                    </Button>
                    <Button variant="outline" onClick={onDownloadPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      {t('pmTemplates.view.downloadPDF')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Compatibility Rules - available for admins on all templates */}
            {/* Rules are organization-scoped, so each org can set their own rules for any template */}
            {isAdmin && !isLoadingRules && (
              <div className="space-y-3">
                <PMTemplateCompatibilityRulesEditor
                  rules={editedRules}
                  onChange={handleRulesChange}
                  disabled={bulkSetRules.isPending}
                />
                {hasRulesChanges && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveRules} 
                      disabled={bulkSetRules.isPending}
                    >
                      {bulkSetRules.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {t('pmTemplates.view.saveRules')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Accordion type="multiple" value={expanded} onValueChange={(v) => setExpanded(v as string[])}>
              {sections.map((section) => (
                <AccordionItem key={section.name} value={section.name} id={`section-${encodeURIComponent(section.name)}`}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full">
                      <div className="font-medium">{section.name}</div>
                      <div className="text-sm text-muted-foreground">{t('pmTemplates.view.itemCount', { count: section.items.length })}</div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {section.items.map((item, idx) => (
                        <div key={item.id} className="rounded border p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {idx + 1}. {item.title}
                            </div>
                            <Badge variant={item.required ? 'default' : 'outline'}>
                              {item.required ? t('pmTemplates.view.required') : t('pmTemplates.view.optional')}
                            </Badge>
                          </div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground mt-2">{item.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}

    </div>
  );
};

export default PMTemplateView;
