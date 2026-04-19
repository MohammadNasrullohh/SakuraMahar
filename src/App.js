import React, { useEffect, useMemo, useState, useRef } from 'react';
import './App.css';
import './styles/animations.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import HowItWorks from './components/HowItWorks';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import PackageCheckoutPage from './components/PackageCheckoutPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ToastContainer from './components/ToastContainer';
import { clearAuthSession, verifyStoredSession } from './services/authService';
import { fetchSiteContent, trackSiteEvent } from './services/siteService';
import {
  buildProductInquiryText,
  buildWhatsAppUrl,
  fillCheckoutTemplate,
  normalizeCheckoutContent
} from './utils/checkoutContent';

const isAdminUser = (candidate) =>
  Boolean(
    candidate &&
      String(candidate.role || '').trim().toLowerCase() === 'admin'
  );

const defaultBranding = {
  brandName: 'Sakura Mahar',
  browserTitle: 'Sakura Mahar - Mahar Custom & Aksesoris',
  metaDescription: 'Sakura Mahar - toko mahar custom, bingkai mahar, isian mahar, aksesoris, dan packing wajib.',
  logoUrl: '/favicon.svg',
  logoAlt: 'Logo Sakura Mahar',
  logoIconClass: 'fas fa-cherry',
  faviconUrl: '/favicon.svg'
};

const createFallbackFavicon = (brandName) => {
  const initial = (brandName || 'S').trim().charAt(0).toUpperCase() || 'S';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e91e63" />
          <stop offset="100%" stop-color="#9c27b0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#g)" />
      <text x="32" y="41" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const PACKAGE_INQUIRY_STORAGE_KEY = 'sakuraMaharProductInquiry';
const ANALYTICS_VISITOR_KEY = 'sakuraMaharVisitorId';
const MIN_SCROLL_OFFSET = 96;
const HEADER_SCROLL_GAP = 20;
const HASH_SCROLL_RETRY_LIMIT = 6;
const HASH_SCROLL_RETRY_DELAY = 120;

const createAnalyticsVisitorId = () => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `visitor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const getAnalyticsVisitorId = () => {
  try {
    const cachedId = localStorage.getItem(ANALYTICS_VISITOR_KEY);

    if (cachedId) {
      return cachedId;
    }

    const nextId = createAnalyticsVisitorId();
    localStorage.setItem(ANALYTICS_VISITOR_KEY, nextId);
    return nextId;
  } catch (error) {
    return createAnalyticsVisitorId();
  }
};

const getHeaderScrollOffset = () => {
  const header = document.querySelector('.header');
  const headerHeight = header?.getBoundingClientRect?.().height || 0;

  return Math.max(Math.round(headerHeight + HEADER_SCROLL_GAP), MIN_SCROLL_OFFSET);
};

const getCurrentHashSectionId = () => decodeURIComponent(window.location.hash.replace(/^#/, '').trim());

const scrollWindowToSection = (sectionId, behavior = 'smooth') => {
  if (!sectionId) {
    return false;
  }

  const target = document.getElementById(sectionId);
  if (!target) {
    return false;
  }

  const offsetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderScrollOffset();
  window.scrollTo({ top: Math.max(offsetTop, 0), behavior });
  return true;
};

const updateSectionHash = (sectionId, replace = false) => {
  const historyMethod = replace ? 'replaceState' : 'pushState';
  const nextUrl = sectionId === 'home'
    ? `${window.location.pathname}${window.location.search}`
    : `${window.location.pathname}${window.location.search}#${sectionId}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history[historyMethod](null, '', nextUrl);
  }
};

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [siteContent, setSiteContent] = useState(null);
  const [siteSummary, setSiteSummary] = useState({});
  const [pendingPackageCheckout, setPendingPackageCheckout] = useState(null);
  const [contactInquiry, setContactInquiry] = useState(null);
  const toastRef = useRef(null);
  const currentPath = window.location.pathname;
  const currentSearch = new URLSearchParams(window.location.search);

  const isAdminRoute = currentPath === '/admin';
  const checkoutPackageId = currentPath === '/checkout'
    ? currentSearch.get('product') || currentSearch.get('package')
    : null;
  const resetToken = currentPath === '/reset-password' ? currentSearch.get('token') : null;
  const branding = useMemo(
    () => ({
      ...defaultBranding,
      ...(siteContent?.branding || {})
    }),
    [siteContent]
  );
  const checkoutContent = useMemo(
    () => normalizeCheckoutContent(siteContent?.checkout),
    [siteContent]
  );
  const catalogItems = useMemo(
    () => siteContent?.products || siteContent?.services || [],
    [siteContent]
  );

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const verifiedUser = await verifyStoredSession();
        if (isMounted) {
          setUser(verifiedUser);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    };

    syncSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    trackSiteEvent({
      eventType: 'page_view',
      visitorId: getAnalyticsVisitorId(),
      path: currentPath || '/'
    }).catch(() => {
      // Jangan ganggu UX jika analytics gagal tercatat.
    });
  }, [currentPath, isAdminRoute]);

  useEffect(() => {
    try {
      const rawInquiry = sessionStorage.getItem(PACKAGE_INQUIRY_STORAGE_KEY);
      if (rawInquiry) {
        setContactInquiry(JSON.parse(rawInquiry));
      }
    } catch (error) {
      // Ignore malformed inquiry cache.
    }
  }, []);

  useEffect(() => {
    const title = branding.browserTitle || `${branding.brandName} - Mahar Custom & Aksesoris`;
    const description = branding.metaDescription || defaultBranding.metaDescription;
    const faviconUrl = branding.faviconUrl || createFallbackFavicon(branding.brandName);
    const siteUrl = window.location.origin;

    document.title = title;

    const ensureMeta = (attrName, attrType, content) => {
      let selector = `${attrType}="${attrName}"`;
      let meta = document.head.querySelector(`meta[${selector}]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrType, attrName);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    ensureMeta('description', 'name', description);
    ensureMeta('og:title', 'property', title);
    ensureMeta('og:description', 'property', description);
    ensureMeta('og:image', 'property', faviconUrl);
    ensureMeta('og:url', 'property', siteUrl);
    ensureMeta('og:type', 'property', 'website');
    ensureMeta('twitter:card', 'name', 'summary_large_image');
    ensureMeta('twitter:title', 'name', title);
    ensureMeta('twitter:description', 'name', description);
    ensureMeta('twitter:image', 'name', faviconUrl);

    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.setAttribute('rel', 'icon');
      document.head.appendChild(faviconLink);
    }
    faviconLink.setAttribute('href', faviconUrl);
  }, [branding]);

  useEffect(() => {
    if (currentPath !== '/') {
      return undefined;
    }

    const previousScrollRestoration = 'scrollRestoration' in window.history
      ? window.history.scrollRestoration
      : null;
    const timeoutIds = new Set();
    let frameId = null;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const clearScheduled = () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.clear();

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const schedule = (callback, delay = 0) => {
      const timeoutId = window.setTimeout(() => {
        timeoutIds.delete(timeoutId);
        callback();
      }, delay);

      timeoutIds.add(timeoutId);
    };

    const syncScrollWithHash = (behavior = 'auto') => {
      const sectionId = getCurrentHashSectionId();

      if (!sectionId) {
        window.scrollTo({ top: 0, behavior });
        return;
      }

      const attemptScroll = (attempt = 0) => {
        if (scrollWindowToSection(sectionId, behavior)) {
          return;
        }

        if (attempt < HASH_SCROLL_RETRY_LIMIT) {
          schedule(() => attemptScroll(attempt + 1), HASH_SCROLL_RETRY_DELAY);
        }
      };

      frameId = window.requestAnimationFrame(() => attemptScroll());
    };

    const handleHashChange = () => syncScrollWithHash('smooth');
    const handlePageShow = () => syncScrollWithHash('auto');

    schedule(() => syncScrollWithHash('auto'));
    schedule(() => syncScrollWithHash('auto'), 180);

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      clearScheduled();
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('pageshow', handlePageShow);

      if (previousScrollRestoration) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [currentPath]);

  useEffect(() => {
    let isMounted = true;

    const loadSiteContent = async () => {
      try {
        const response = await fetchSiteContent();

        if (isMounted) {
          setSiteContent(response.content || null);
          setSiteSummary(response.summary || {});
        }
      } catch (error) {
        if (isMounted) {
          setSiteContent(null);
          setSiteSummary({});
        }
      }
    };

    loadSiteContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const openLogin = () => setModalType('login');
  const openSignup = () => setModalType('register');
  const openChangePassword = () => setModalType('changePassword');
  const closeModal = () => {
    setModalType(null);
    if (!user) {
      setPendingPackageCheckout(null);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
  };

  const scrollToSection = (sectionId, options = {}) => {
    const { behavior = 'smooth', updateHash = false, replaceHash = false } = options;
    const hasScrolled = scrollWindowToSection(sectionId, behavior);

    if (hasScrolled && updateHash) {
      updateSectionHash(sectionId, replaceHash);
    }

    return hasScrolled;
  };

  const storeContactInquiry = (service) => {
    if (!service) {
      setContactInquiry(null);
      sessionStorage.removeItem(PACKAGE_INQUIRY_STORAGE_KEY);
      return;
    }

    const inquiry = {
      id: service.id,
      name: service.name,
      price: service.price || '',
      duration: service.duration || ''
    };

    setContactInquiry(inquiry);
    sessionStorage.setItem(PACKAGE_INQUIRY_STORAGE_KEY, JSON.stringify(inquiry));
  };

  const navigateToHomeSection = (sectionId, service = null, options = {}) => {
    const { behavior = 'smooth', replaceHash = false } = options;

    if (sectionId === 'contact') {
      storeContactInquiry(service);
    }

    if (currentPath === '/') {
      if (!scrollToSection(sectionId, { behavior, updateHash: sectionId !== 'home', replaceHash })) {
        if (sectionId === 'home') {
          window.scrollTo({ top: 0, behavior });
          updateSectionHash(sectionId, replaceHash);
        }
      } else if (sectionId === 'home') {
        updateSectionHash(sectionId, replaceHash);
      }
      return;
    }

    window.location.assign(sectionId === 'home' ? '/' : `/#${sectionId}`);
  };

  const goToCheckout = (serviceId) => {
    window.location.assign(`/checkout?product=${encodeURIComponent(String(serviceId))}`);
  };

  const navigateToAdminPage = () => {
    if (isAdminRoute) {
      return;
    }

    window.location.assign('/admin');
  };

  const handlePackageSelect = (service) => {
    if (!service?.id) {
      return;
    }

    if (checkoutContent.primaryActionMode === 'contact') {
      navigateToHomeSection('contact', service);
      return;
    }

    if (checkoutContent.primaryActionMode === 'whatsapp') {
      const whatsappLink = buildWhatsAppUrl(
        siteContent?.contact,
        buildProductInquiryText(service, branding.brandName)
      );

      if (whatsappLink) {
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (!checkoutContent.requireLoginBeforeCheckout || user) {
      storeContactInquiry(service);
      goToCheckout(service.id);
      return;
    }

    setPendingPackageCheckout({
      id: service.id,
      name: service.name
    });
    setModalType('login');
  };

  const handlePrimaryAction = () => {
    if (isAdminUser(user)) {
      navigateToAdminPage();
      return;
    }

    openSignup();
  };

  const handleSecondaryAction = () => {
    navigateToHomeSection('features');
  };

  const refreshSiteContent = async () => {
    try {
      const response = await fetchSiteContent();
      setSiteContent(response.content || null);
      setSiteSummary(response.summary || {});
    } catch (error) {
      // Keep the previous public content when refresh fails.
    }
  };

  useEffect(() => {
    if (user && pendingPackageCheckout?.id) {
      const targetId = pendingPackageCheckout.id;
      storeContactInquiry(pendingPackageCheckout);
      setPendingPackageCheckout(null);
      goToCheckout(targetId);
    }
  }, [user, pendingPackageCheckout]);

  const authPromptMessage = pendingPackageCheckout?.name
    ? fillCheckoutTemplate(checkoutContent.authPromptText, {
      productName: pendingPackageCheckout.name,
      packageName: pendingPackageCheckout.name
    })
    : '';

  if (currentPath === '/reset-password') {
    return <ResetPasswordPage token={resetToken} brandName={branding.brandName} />;
  }

  if (currentPath === '/checkout') {
    return (
      <>
        {modalType && (
          <AuthModal
            type={modalType}
            onClose={closeModal}
            onLoginSuccess={setUser}
            onOpenModal={setModalType}
            brandName={branding.brandName}
            contextMessage={authPromptMessage}
          />
        )}
        <PackageCheckoutPage
          packageId={checkoutPackageId}
          user={user}
          isAuthChecking={isAuthChecking}
          products={catalogItems}
          contactContent={siteContent?.contact}
          branding={branding}
          checkoutContent={checkoutContent}
          onRequireAuth={(nextType) => setModalType(nextType)}
          onBackHome={navigateToHomeSection}
        />
      </>
    );
  }

  if (isAdminRoute) {
    return (
      <div className="App admin-app">
        <ToastContainer ref={toastRef} />
        {modalType && (
          <AuthModal
            type={modalType}
            onClose={closeModal}
            onLoginSuccess={setUser}
            onOpenModal={setModalType}
            brandName={branding.brandName}
            contextMessage={authPromptMessage}
          />
        )}
        <AdminPanel
          user={user}
          isAdmin={isAdminUser(user)}
          isAuthChecking={isAuthChecking}
          siteContent={siteContent}
          siteSummary={siteSummary}
          onContentUpdated={refreshSiteContent}
          onSessionUserUpdated={setUser}
          onBackHome={() => navigateToHomeSection('home')}
          onLoginClick={openLogin}
          onSignupClick={openSignup}
          onLogout={handleLogout}
          onChangePasswordClick={openChangePassword}
          branding={branding}
          standalone
        />
      </div>
    );
  }

  return (
    <div className="App">
      <ToastContainer ref={toastRef} />
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onLoginClick={openLogin}
        onSignupClick={openSignup}
        user={user}
        onLogout={handleLogout}
        isAuthChecking={isAuthChecking}
        isAdmin={isAdminUser(user)}
        onAdminClick={navigateToAdminPage}
        onChangePasswordClick={openChangePassword}
        branding={branding}
        onNavigate={navigateToHomeSection}
      />
      {modalType && (
        <AuthModal
          type={modalType}
          onClose={closeModal}
          onLoginSuccess={setUser}
          onOpenModal={setModalType}
          brandName={branding.brandName}
          contextMessage={authPromptMessage}
        />
      )}
      <Hero
        content={siteContent}
        onPrimaryAction={handlePrimaryAction}
        onSecondaryAction={handleSecondaryAction}
      />
      <Features items={siteContent?.features} />
      <HowItWorks />
      <Services
        items={catalogItems}
        isLoggedIn={Boolean(user)}
        onSelectProduct={handlePackageSelect}
        onContactClick={(service) => navigateToHomeSection('contact', service)}
        onWhatsAppClick={(service) => {
          const whatsappLink = buildWhatsAppUrl(
            siteContent?.contact,
            buildProductInquiryText(service, branding.brandName)
          );

          if (whatsappLink) {
            window.open(whatsappLink, '_blank', 'noopener,noreferrer');
          }
        }}
        primaryActionLabelLoggedIn={checkoutContent.primaryActionLoggedInLabel}
        primaryActionLabelLoggedOut={checkoutContent.primaryActionLoggedOutLabel}
        showContactShortcut={checkoutContent.contactShortcutEnabled}
        contactShortcutLabel={checkoutContent.contactShortcutLabel}
        showWhatsAppShortcut={checkoutContent.whatsappShortcutEnabled}
        whatsappShortcutLabel={checkoutContent.whatsappShortcutLabel}
      />
      <Testimonials items={siteContent?.testimonials} onNavigate={navigateToHomeSection} />
      <FAQ />
      <Contact
        content={siteContent?.contact}
        brandName={branding.brandName}
        inquiryContext={contactInquiry}
        onInquiryHandled={() => storeContactInquiry(null)}
      />
      <Footer
        content={siteContent?.footer}
        contact={siteContent?.contact}
        branding={branding}
        onNavigate={navigateToHomeSection}
      />
    </div>
  );
}

export default App;
