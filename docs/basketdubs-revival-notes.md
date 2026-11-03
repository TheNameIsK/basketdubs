# Basketdubs Revival Notes

**Date:** 3 November 2026

## Recovery steps

Basketdubs was brought back online without making any changes to the
application code. The issue was resolved by restoring the external
services, refreshing the required credentials, and redeploying the
existing applications.

1.  **Restore the Supabase project**
    -   Checked that the Supabase project was active again after being
        paused due to inactivity.
    -   Confirmed that the project was available before troubleshooting
        the application connections.
2.  **Refresh API keys and credentials**
    -   Updated the Supabase credentials used by Basketdubs so the
        application could connect using the current project keys.
    -   Updated the Basketdubs-related API keys and configuration where
        required.
    -   Refreshed the Gemini API key used by the project.
    -   Ensured the updated values were reflected in the relevant
        deployment environment variables.
3.  **Turn the Render service back on**
    -   Reactivated the Render backend service, which had also been
        inactive.
    -   Waited for the service to become available so it could be
        redeployed.
4.  **Redeploy the applications**
    -   Redeployed the backend service on Render with the refreshed
        environment configuration.
    -   Redeployed the frontend on Vercel to ensure the live deployment
        was up to date.
    -   Checked the deployed application and confirmed that its main
        features and service connections were working again.

## Result

Basketdubs is live and working again. The recovery required only service
reactivation, credential updates, and redeployment. **No application
code was changed.**
