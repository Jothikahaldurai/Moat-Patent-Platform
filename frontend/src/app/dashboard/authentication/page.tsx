import { ModuleWorkbench } from "@/components/modules/ModuleWorkbench";

export default function Page() {
  return (
    <ModuleWorkbench
      index={1}
      title="Authentication"
      status="live"
      summary="Identity, session, token refresh, OAuth/local sign-in, and user role boundaries for the patent intelligence platform."
      inputs={["Email/password", "OAuth callback", "JWT access token", "Refresh token"]}
      outputs={["Authenticated session", "User profile", "Role claims", "Session audit event"]}
      engines={["Credential validation", "Token issuance", "Session hydration", "Unauthorized request handling"]}
      api="POST /api/v1/auth/login | POST /api/v1/auth/signup | GET /api/v1/auth/me"
      data={["users", "auth tokens", "session middleware"]}
    />
  );
}
