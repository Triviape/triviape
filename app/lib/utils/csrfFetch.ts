'use client';

import { getCSRFTokenData } from '../security/csrfProtection';

/**
 * Enhanced fetch with automatic CSRF protection
 */
export async function csrfFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token data
  const { token, headerName } = await getCSRFTokenData();
  
  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Add CSRF token for state-changing requests
  if (token && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    headers.set(headerName, token);
  }
  
  // Ensure Content-Type is set for JSON requests
  if (options.body && typeof options.body === 'string') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }
  
  // Add credentials for CSRF cookie
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || 'same-origin',
  };
  
  return fetch(url, requestOptions);
}

/**
 * CSRF-protected POST request
 */
export async function csrfPost(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * CSRF-protected PUT request
 */
export async function csrfPut(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * CSRF-protected DELETE request
 */
export async function csrfDelete(url: string, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, {
    method: 'DELETE',
    ...options,
  });
}

/**
 * CSRF-protected PATCH request
 */
export async function csrfPatch(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * Hook-based API client for React components
 */
export function useCSRFAPI() {
  return {
    get: (url: string, options?: RequestInit) => csrfFetch(url, { method: 'GET', ...options }),
    post: csrfPost,
    put: csrfPut,
    patch: csrfPatch,
    delete: csrfDelete,
  };
}