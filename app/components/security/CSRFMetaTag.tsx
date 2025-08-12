import { generateCSRFToken } from '@/app/lib/security/csrfProtection';

/**
 * Server component to include CSRF token in meta tags
 * This provides the CSRF token to the client-side without additional API calls
 */
export async function CSRFMetaTag() {
  try {
    const csrfToken = await generateCSRFToken();
    
    return (
      <meta name="csrf-token" content={csrfToken} />
    );
  } catch (error) {
    console.error('Failed to generate CSRF token for meta tag:', error);
    return null;
  }
}

/**
 * Component to include multiple security-related meta tags
 */
export async function SecurityMetaTags() {
  const csrfToken = await generateCSRFToken().catch(() => '');
  
  return (
    <>
      {/* CSRF Token */}
      {csrfToken && <meta name="csrf-token" content={csrfToken} />}
      
      {/* Security Headers as Meta Tags */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Content Security Policy */}
      <meta 
        httpEquiv="Content-Security-Policy" 
        content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
      />
    </>
  );
}