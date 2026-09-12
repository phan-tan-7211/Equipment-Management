import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HCaptchaComponent from '@/components/ui/HCaptcha';
import { PageSEO } from '@/components/seo/PageSEO';
import { PublicFormFieldInput } from '@/features/public-forms/PublicFormFieldInput';
import {
  PublicFormErrorState,
  PublicFormLoadingState,
  PublicFormSuccessCard,
} from '@/features/public-forms/PublicFormStates';
import {
  formatPublicSubmittedAt,
  usePublicFormSubmission,
} from '@/features/public-forms/usePublicFormClientContext';
import {
  loadQuickForm,
  submitQuickForm,
} from '@/features/quick-forms/services/quickFormPublicService';
import {
  validateQuickFormValues,
  type QuickFormField,
} from '@/features/quick-forms/types/quickForm';

export default function QuickFormPublicPage() {
  const { t, language } = useI18n();
  const dateLocale = { vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' }[language];
  const { token = '' } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [fields, setFields] = useState<QuickFormField[]>([]);
  const [collectLocation, setCollectLocation] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    submitting,
    setSubmitting,
    submitted,
    setSubmitted,
    submittedAt,
    setSubmittedAt,
    hcaptchaToken,
    setHcaptchaToken,
    showCaptcha,
    captchaMisconfigured,
    coords,
    gpsStatus,
  } = usePublicFormSubmission({
    captchaRequired,
    collectGps: collectLocation && Boolean(token),
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await loadQuickForm(token);
        if (cancelled) return;
        setFormName(data.form.name);
        setFormDescription(data.form.description);
        setOrganizationName(data.form.organizationName);
        setFields(data.form.fields);
        setCollectLocation(data.form.collectLocation);
        setCaptchaRequired(data.captchaRequired);
      } catch {
        if (!cancelled) setLoadError('unavailable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (token) void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const validation = useMemo(
    () => validateQuickFormValues(fields, values, (label) => t('quickForms.public.required', { name: label })),
    [fields, values, t],
  );

  const canSubmit =
    !captchaMisconfigured &&
    validation.isComplete &&
    (!captchaRequired || hcaptchaToken !== null);

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitQuickForm({
        token,
        fieldValues: values,
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        captchaToken: hcaptchaToken ?? undefined,
      });
      setSubmittedAt(result.submittedAt);
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('quickForms.public.submitFailed');
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateValue(fieldId: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  if (loading) {
    return <PublicFormLoadingState message={t('quickForms.public.load')} />;
  }

  if (loadError) {
    return <PublicFormErrorState message={t('quickForms.public.linkUnavailable')} />;
  }

  if (submitted) {
    return (
      <PublicFormSuccessCard title={t('quickForms.public.success')}>
        <p>
          {submittedAt
            ? t('quickForms.public.savedAt', { name: formName, date: formatPublicSubmittedAt(submittedAt, dateLocale) })
            : t('quickForms.public.saved', { name: formName })}
        </p>
        <p className="text-xs">{t('quickForms.public.closePage')}</p>
      </PublicFormSuccessCard>
    );
  }

  return (
    <>
      <PageSEO title={`${formName} — ${t('quickForms.public.seoSuffix')}`} noindex />
      <div className="min-h-screen bg-background p-4 pb-24 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{formName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{organizationName}</p>
          {formDescription && <p className="text-sm mt-2">{formDescription}</p>}
        </div>

        {captchaMisconfigured && (
          <Alert variant="destructive">
            <AlertDescription>
              {t('quickForms.public.captchaMisconfigured')}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('quickForms.public.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field) => (
              <PublicFormFieldInput
                key={field.id}
                fieldId={`quick-form-field-${field.id}`}
                label={field.label}
                inputType={field.inputType}
                required={field.required !== false}
                helpText={field.helpText}
                value={values[field.id]}
                onChange={(value) => updateValue(field.id, value)}
              />
            ))}

            {collectLocation && (
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('quickForms.public.yourLocation')}</p>
                <p className="text-sm text-muted-foreground">
                  {gpsStatus === 'pending'
                    ? t('quickForms.public.requestingLocation')
                    : gpsStatus === 'granted' && coords
                      ? `${coords.lat}, ${coords.lng}`
                      : t('quickForms.public.notProvided')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {showCaptcha && (
          <HCaptchaComponent
            onSuccess={(token) => setHcaptchaToken(token)}
            onExpire={() => setHcaptchaToken(null)}
          />
        )}

        {validation.errors.length > 0 && (
          <Alert>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {captchaRequired && !hcaptchaToken && !captchaMisconfigured && (
          <p className="text-xs text-muted-foreground text-center">{t('quickForms.public.captchaPrompt')}</p>
        )}

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button className="w-full" size="lg" disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}>
          {submitting ? t('quickForms.public.submitting') : t('quickForms.public.submit')}
        </Button>
      </div>
    </>
  );
}
