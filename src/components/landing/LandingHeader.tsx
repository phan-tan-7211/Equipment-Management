import type { MouseEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useActiveSection } from '@/hooks/useActiveSection';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavigationItem {
  labelKey: string;
  href: string;
}

const navigation: NavigationItem[] = [
  { labelKey: 'features', href: '#features' },
  { labelKey: 'about', href: '#about' },
  { labelKey: 'customers', href: '#customers' },
  { labelKey: 'pricing', href: '#pricing' },
];

/** Crawler-visible deep links to primary marketing feature routes */
const featureDeepLinks: Array<{ labelKey: string; to: string }> = [
  { labelKey: 'workOrders', to: '/features/work-order-management' },
  { labelKey: 'qrCodes', to: '/features/qr-code-integration' },
  { labelKey: 'quickBooks', to: '/features/quickbooks' },
];

// Stable constant for section IDs to avoid unnecessary re-renders (order matches page flow)
const SECTION_IDS: string[] = ['features', 'about', 'customers', 'pricing'];

const LandingHeader = () => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnMarketingHome = location.pathname === '/';

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      if (isOnMarketingHome) {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: 'smooth' });
      } else {
        const id = href.slice(1);
        navigate({ pathname: '/', hash: id });
      }
    }
  };

  const activeSection = useActiveSection(isOnMarketingHome ? SECTION_IDS : []);
  const activeSectionToUse = isOnMarketingHome ? activeSection : null;
  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" title="" />
              <span className="font-bold text-xl text-foreground">EquipQR™</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isHash = item.href.startsWith('#');
              // Active logic only on landing page
              let isActive = false;
              if (isOnMarketingHome && isHash) {
                isActive = activeSectionToUse ? `#${activeSectionToUse}` === item.href : false;
              }
              
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={[
                    'transition-colors',
                    'text-muted-foreground hover:text-foreground',
                    isActive ? 'text-foreground font-semibold' : ''
                  ].join(' ')}
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {t(`publicChrome.header.${item.labelKey}`)}
                </a>
              );
            })}
            <div
              className="hidden xl:flex items-center gap-4 ml-2 pl-4 border-l border-border"
              aria-label={t('publicChrome.header.popularFeatures')}
            >
              {featureDeepLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {t(`publicChrome.header.${link.labelKey}`)}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Button asChild>
              <Link to="/auth">{t('publicChrome.header.getStarted')}</Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('publicChrome.header.openMenu')}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-75 sm:w-100">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t('publicChrome.header.siteNavigation')}</SheetTitle>
                  <SheetDescription>
                    {t('publicChrome.header.menuDescription')}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-8 mt-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      {t('publicChrome.header.onThisPage')}
                    </p>
                    <nav className="flex flex-col gap-1" aria-label={t('publicChrome.header.pageSections')}>
                      {navigation.map((item) => {
                        const isHash = item.href.startsWith('#');
                        let isActive = false;
                        if (isOnMarketingHome && isHash) {
                          isActive = activeSectionToUse ? `#${activeSectionToUse}` === item.href : false;
                        }

                        const href =
                          isHash && !isOnMarketingHome ? `/${item.href}` : item.href;

                        return (
                          <SheetClose asChild key={item.href}>
                            <a
                              href={href}
                              className={[
                                'rounded-lg px-3 py-2.5 text-base font-medium transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                isActive
                                  ? 'bg-primary/10 text-foreground ring-1 ring-primary/20'
                                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                              ].join(' ')}
                              aria-current={isActive ? 'location' : undefined}
                              onClick={(e) => handleNavClick(e, item.href)}
                            >
                              {t(`publicChrome.header.${item.labelKey}`)}
                            </a>
                          </SheetClose>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="space-y-3 border-t border-border pt-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      {t('publicChrome.header.featureGuides')}
                    </p>
                    <nav className="flex flex-col gap-1" aria-label={t('publicChrome.header.featurePages')}>
                      {featureDeepLinks.map((link) => (
                        <SheetClose asChild key={link.to}>
                          <Link
                            to={link.to}
                            className="rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            {t(`publicChrome.header.${link.labelKey}`)}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  </div>
                  <div className="space-y-3 border-t border-border pt-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      {t('publicChrome.header.account')}
                    </p>
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Button asChild className="w-full h-11">
                          <Link to="/auth">{t('publicChrome.header.getStarted')}</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default LandingHeader;