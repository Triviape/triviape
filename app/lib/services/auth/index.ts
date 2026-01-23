/**
 * Auth Services Index
 * 
 * Exports the consolidated authentication service.
 * Old auth services are deprecated and should not be used.
 */

export { authService, ConsolidatedAuthService } from './consolidatedAuthService';

// Re-export for backwards compatibility (will be removed in future)
// @deprecated Use ConsolidatedAuthService instead
export { authService as AuthService } from './consolidatedAuthService'; 