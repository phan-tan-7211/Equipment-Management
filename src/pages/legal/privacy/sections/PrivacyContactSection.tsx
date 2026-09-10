import { ExternalLink } from '@/components/ui/external-link';
import { LegalPolicySection } from '@/components/legal/LegalPolicySection';

export function PrivacyContactSection() {
  return (
    <LegalPolicySection title="14. Contact Us">
            <p>
              If you have any questions about this Privacy Policy, want to exercise your data rights,
              or have concerns about our data practices, please contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong>{' '}
                <ExternalLink href="mailto:phantan7211@gmail.com" className="hover:text-foreground">
                  phantan7211@gmail.com
                </ExternalLink>
              </li>
              <li>
                <strong>Website:</strong>{' '}
                <ExternalLink href="https://phantan.com" className="hover:text-foreground">
                  phantan.com
                </ExternalLink>
              </li>
              <li>
                <strong>Company:</strong>{' '}
                <ExternalLink href="https://phantan.com" className="hover:text-foreground">
                  Phan Tan
                </ExternalLink>
              </li>
              <li>
                <strong>Address:</strong> Contact us for business address information
              </li>
            </ul>
            <p>
              We aim to respond to all privacy-related inquiries within 45 calendar days.
            </p></LegalPolicySection>
  );
}
