import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CcpaRightsList } from '@/components/legal/CcpaRightsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSEO } from '@/components/seo/PageSEO';
import { supabase } from '@/integrations/supabase/client';
import {
  PRIVACY_REQUEST_DETAILS_MAX_LENGTH,
  PRIVACY_REQUEST_NAME_MAX_LENGTH,
} from '@/features/legal/privacyRequestLimits';
import HCaptchaComponent from '@/components/ui/HCaptcha';
import { useI18n } from '@/i18n';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQUEST_TYPES = [
  { value: 'access' },
  { value: 'deletion' },
  { value: 'correction' },
  { value: 'opt_out' },
  { value: 'limit_use' },
] as const;

export default function PrivacyRequest() {
  const { t } = useI18n();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);

  const hcaptchaEnabled = Boolean(import.meta.env.VITE_HCAPTCHA_SITEKEY);

  const isValid =
    fullName.trim().length > 0 &&
    EMAIL_PATTERN.test(email) &&
    requestType.length > 0 &&
    (!hcaptchaEnabled || hcaptchaToken !== null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-privacy-request`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: fullName.trim(),
            email: email.trim(),
            requestType,
            details: details.trim() || undefined,
            captchaToken: hcaptchaToken,
          }),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || t('privacyRequest.submitFailedShort'));
      }

      toast.success(
        t('privacyRequest.submittedToast'),
      );
      setSubmitted(true);
    } catch (err) {
      const fallbackMessage = t('privacyRequest.submitFailed');
      const baseMessage = err instanceof Error ? err.message : fallbackMessage;
      const userMessage =
        baseMessage === 'Failed to submit request' || baseMessage === t('privacyRequest.submitFailedShort')
          ? t('privacyRequest.serviceUnavailable')
          : baseMessage;
      setSubmitError(userMessage);
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageSEO
        title={t('privacyRequest.title')}
        description={t('privacyRequest.seoDescription')}
        path="/privacy-request"
      />

      <div className="mb-8">
        <PageBackButton className="mb-4" />
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t('privacyRequest.title')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('privacyRequest.intro')}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('privacyRequest.submitTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-lg font-medium">
                  {t('privacyRequest.thankYou')}
                </p>
                <p className="text-muted-foreground">
                  {t('privacyRequest.responseTime')}
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/privacy-policy">{t('privacyRequest.viewPolicy')}</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFullName('');
                      setEmail('');
                      setRequestType('');
                      setDetails('');
                      setHcaptchaToken(null);
                      setSubmitted(false);
                    }}
                  >
                    {t('privacyRequest.submitAnother')}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      {t('privacyRequest.fullName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      maxLength={PRIVACY_REQUEST_NAME_MAX_LENGTH}
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t('privacyRequest.emailAddress')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestType">
                    {t('privacyRequest.requestType')} <span className="text-destructive">*</span>
                  </Label>
                  <Select value={requestType} onValueChange={setRequestType} required>
                    <SelectTrigger id="requestType">
                      <SelectValue placeholder={t('privacyRequest.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(`privacyRequest.types.${type.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">{t('privacyRequest.additionalDetails')}</Label>
                  <Textarea
                    id="details"
                    placeholder={t('privacyRequest.detailsPlaceholder')}
                    rows={4}
                    maxLength={PRIVACY_REQUEST_DETAILS_MAX_LENGTH}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>

                {hcaptchaEnabled && (
                  <HCaptchaComponent
                    onSuccess={(token) => setHcaptchaToken(token)}
                    onError={() => setHcaptchaToken(null)}
                    onExpire={() => setHcaptchaToken(null)}
                  />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-destructive">*</span> {t('privacyRequest.requiredFields')}
                  </p>
                  <Button type="submit" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? t('privacyRequest.submitting') : t('privacyRequest.submitRequest')}
                  </Button>
                </div>
                {submitError ? (
                  <p role="alert" aria-live="polite" className="text-sm text-destructive">
                    {submitError}
                  </p>
                ) : null}
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('privacyRequest.yourRights')}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              {t('privacyRequest.rightsIntro')}
            </p>
            <CcpaRightsList variant="summary" />
            <p>
              {t('privacyRequest.noSellNotice')}{' '}
              <Link to="/privacy-policy" className="underline">
                {t('privacyRequest.policy')}
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
