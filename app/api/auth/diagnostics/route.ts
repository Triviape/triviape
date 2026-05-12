import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';

/**
 * Firebase Admin connectivity diagnostics (standard API envelope).
 */
export async function GET(request: Request) {
  return withApiErrorHandling(request, async () => {
    const adminStatus: {
      initialized: boolean;
      timestamp: string;
      adminAuthWorking?: boolean;
      adminAuthError?: string;
    } = {
      initialized: true,
      timestamp: new Date().toISOString(),
    };

    try {
      await FirebaseAdminService.getUserById('test-user-id');
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'auth/user-not-found'
      ) {
        adminStatus.adminAuthWorking = true;
      } else {
        adminStatus.adminAuthWorking = false;
        adminStatus.adminAuthError =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: unknown }).message)
            : String(error);
      }
    }

    return {
      adminStatus,
      serverInfo: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      },
    };
  });
}
