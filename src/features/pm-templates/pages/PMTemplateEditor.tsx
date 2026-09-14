import { useI18n } from '@/i18n';
import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSimplifiedOrganizationRestrictions } from '@/features/organization/hooks/useSimplifiedOrganizationRestrictions';
import { usePMTemplate } from '@/features/pm-templates/hooks/usePMTemplates';
import {
  ChecklistTemplateEditor,
  type ChecklistTemplateEditorHandle,
} from '@/features/organization/components/ChecklistTemplateEditor';

const PMTemplateEditor: React.FC = () => {
  const { t } = useI18n();
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const isNew = !templateId;
  const editorRef = useRef<ChecklistTemplateEditorHandle>(null);

  const { currentOrganization } = useOrganization();
  const { hasRole } = usePermissions();
  const { restrictions } = useSimplifiedOrganizationRestrictions();
  const { data: template, isLoading } = usePMTemplate(isNew ? '' : templateId);

  const isAdmin = hasRole(['owner', 'admin']);
  const canCreateCustomTemplates = restrictions.canCreateCustomPMTemplates;

  const handleCancel = () => {
    editorRef.current?.requestCancel();
  };

  const handleSave = () => {
    void editorRef.current?.save();
  };

  const handleSaveSuccess = (savedId?: string) => {
    if (savedId) {
      navigate(`/dashboard/pm-templates/${savedId}`);
      return;
    }
    navigate('/dashboard/pm-templates');
  };

  const handleEditorCancel = () => {
    navigate('/dashboard/pm-templates');
  };

  if (!currentOrganization) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <p className="text-muted-foreground">{t('pmTemplates.list.selectOrganization')}</p>
      </Page>
    );
  }

  if (!isAdmin || !canCreateCustomTemplates) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <p className="text-muted-foreground">
          {t('pmTemplates.editor.adminLicenseRequired')}
        </p>
      </Page>
    );
  }

  if (!isNew && isLoading) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('pmTemplates.editor.loading')}
        </div>
      </Page>
    );
  }

  if (!isNew && !template) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <p className="text-muted-foreground">{t('pmTemplates.view.notFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/pm-templates')}>
          {t('pmTemplates.view.back')}
        </Button>
      </Page>
    );
  }

  const pageTitle = isNew ? t('pmTemplates.editor.createTitle') : t('pmTemplates.editor.editTitle', { name: template?.name ?? t('pmTemplates.editor.templateFallback') });

  return (
    <Page maxWidth="7xl" padding="responsive">
      <div className="space-y-6">
        <PageHeader
          density="compact"
          title={pageTitle}
          description={
            isNew
              ? t('pmTemplates.editor.createDescription')
              : t('pmTemplates.editor.editDescription')
          }
          breadcrumbs={[
            { label: t('dashboard.title'), href: '/dashboard' },
            { label: t('pmTemplates.list.title'), href: '/dashboard/pm-templates' },
            { label: isNew ? t('pmTemplates.editor.new') : template?.name ?? t('pmTemplates.view.edit') },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                {t('pmTemplates.editor.cancel')}
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                {isNew ? t('pmTemplates.editor.create') : t('pmTemplates.editor.save')}
              </Button>
            </div>
          }
        />

        <ChecklistTemplateEditor
          ref={editorRef}
          layoutMode="page"
          template={isNew ? undefined : template}
          onSave={handleSaveSuccess}
          onCancel={handleEditorCancel}
        />
      </div>
    </Page>
  );
};

export default PMTemplateEditor;
