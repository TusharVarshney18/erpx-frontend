import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { api, setTokens, clearTokens, getAccessToken } from "@/lib/api/client";

export type OrganizationInfo = {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
  status: string;
  role?: string;
};

export type UserRole = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  isOwner: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  isSuperAdmin: boolean;
  isOrgAdmin?: boolean;
  isDemo?: boolean;
  currentSessionId?: string | null;
  roles?: UserRole[];
  permissions?: string[];
  subscription?: {
    plan: string;
    status: string;
    isPremium: boolean;
  };
  features?: string[];
  organization: OrganizationInfo;
  userRoles: {
    role: UserRole;
  }[];
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    status: string;
    isSuperAdmin?: boolean;
  };
  session: { id: string; createdAt: string };
  organization: OrganizationInfo;
};

type AuthStepResponse = {
  accessToken?: string;
  refreshToken?: string;
  mfaRequired?: boolean;
  mfaChallenge?: string;
  mfaSetupRequired?: boolean;
  mfaSetupToken?: string;
  orgSelectionRequired?: boolean;
  selectionToken?: string;
  organizations?: OrganizationOption[];
  user?: { email?: string };
};

export type OrganizationOption = {
  id: string;
  name: string;
  code: string;
  slug: string;
};

export type LoginResult =
  | { step: "mfa"; mfaChallenge: string; user: { email: string } }
  | { step: "mfa-setup"; mfaSetupToken: string; user: { email: string } }
  | {
      step: "org-selection";
      selectionToken: string;
      organizations: OrganizationOption[];
      user: { email: string };
    }
  | { step: "done"; accessToken: string; refreshToken: string };

export type LoginCodeDelivery = {
  maskedEmail: string | null;
  deliveredVia: string;
};

export type PhoneLoginCodeDelivery = {
  maskedPhone: string | null;
  deliveredVia: string;
};

type MfaStatus = { enabled: boolean; enabledAt: string | null };
type MfaEnrollResult = { secret: string; otpauthUrl: string };
type MfaEnrollConfirmResult = { backupCodes: string[] };

type RegisterResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    emailVerifiedAt: string | null;
  };
  organization: {
    id: string;
    name: string;
    code: string;
    slug: string;
  };
  requiresEmailVerification?: boolean;
  verification?: {
    maskedEmail: string;
    expiresInSeconds: number;
    deliveredVia: string;
  };
};

export type OtpDelivery = {
  maskedEmail: string;
  expiresInSeconds: number;
  deliveredVia: string;
};

type SignUpResult = {
  requiresEmailVerification: boolean;
  email: string;
  maskedEmail?: string;
  deliveredVia?: string;
};

// A pending org-switch step that must be finished on the /auth screen (MFA
// challenge or mandatory MFA setup). Held in memory (single tab) and consumed
// by the /auth route on mount.
type PendingSwitchStep = { kind: "mfa"; challenge: string } | { kind: "mfa-setup" };
let pendingSwitchStep: PendingSwitchStep | null = null;

export function consumePendingSwitchStep(): PendingSwitchStep | null {
  const step = pendingSwitchStep;
  pendingSwitchStep = null;
  return step;
}

type AuthCtx = {
  user: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  organizations: OrganizationInfo[];
  activeOrganizationId: string | null;
  signIn: (email: string, password: string) => Promise<LoginResult>;
  completeMfaLogin: (challenge: string, code: string) => Promise<void>;
  requestLoginCode: (email: string) => Promise<LoginCodeDelivery>;
  verifyLoginCode: (email: string, code: string) => Promise<LoginResult>;
  requestPhoneLoginCode: (phone: string) => Promise<PhoneLoginCodeDelivery>;
  verifyPhoneLoginCode: (phone: string, code: string) => Promise<LoginResult>;
  completeOAuthLogin: (grant: string) => Promise<LoginResult>;
  selectOrganization: (selectionToken: string, orgId: string) => Promise<LoginResult>;
  mfaStatus: () => Promise<MfaStatus>;
  startMfaEnroll: () => Promise<MfaEnrollResult>;
  confirmMfaEnroll: (secret: string, code: string) => Promise<MfaEnrollConfirmResult>;
  regenerateMfaBackupCodes: (code: string) => Promise<MfaEnrollConfirmResult>;
  disableMfa: (code: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    organizationCode: string;
    phone?: string;
  }) => Promise<SignUpResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (
    email: string,
    purpose?: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
  ) => Promise<OtpDelivery>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ maskedEmail: string | null }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  resendInvite: (email: string) => Promise<OtpDelivery>;
  acceptInvite: (email: string, code: string, password: string) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<LoginResult>;
  refreshOrganizations: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  isSuperAdmin: false,
  organizations: [],
  activeOrganizationId: null,
  signIn: async () => ({ step: "done", accessToken: "", refreshToken: "" }),
  completeMfaLogin: async () => {},
  requestLoginCode: async () => ({ maskedEmail: null, deliveredVia: "console" }),
  verifyLoginCode: async () => ({ step: "done", accessToken: "", refreshToken: "" }),
  requestPhoneLoginCode: async () => ({ maskedPhone: null, deliveredVia: "console" }),
  verifyPhoneLoginCode: async () => ({ step: "done", accessToken: "", refreshToken: "" }),
  completeOAuthLogin: async () => ({ step: "done", accessToken: "", refreshToken: "" }),
  selectOrganization: async () => ({ step: "done", accessToken: "", refreshToken: "" }),
  mfaStatus: async () => ({ enabled: false, enabledAt: null }),
  startMfaEnroll: async () => ({ secret: "", otpauthUrl: "" }),
  confirmMfaEnroll: async () => ({ backupCodes: [] }),
  regenerateMfaBackupCodes: async () => ({ backupCodes: [] }),
  disableMfa: async () => {},
  signUp: async () => ({ requiresEmailVerification: false, email: "" }),
  verifyEmail: async () => {},
  resendVerification: async () => ({
    maskedEmail: "",
    expiresInSeconds: 600,
    deliveredVia: "console",
  }),
  signOut: async () => {},
  forgotPassword: async () => ({ maskedEmail: null }),
  resetPassword: async () => {},
  resendInvite: async () => ({ maskedEmail: "", expiresInSeconds: 600, deliveredVia: "console" }),
  acceptInvite: async () => {},
  switchOrganization: async () => ({ step: "done", accessToken: "", refreshToken: "" }),
  refreshOrganizations: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      const orgs = await api.get<OrganizationInfo[]>("/auth/organizations");
      setOrganizations(orgs);
    } catch {
      // ignore
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const profile = await api.get<UserProfile>("/auth/me");
      setUser(profile);
      setActiveOrganizationId(profile.organization.id);
    } catch {
      clearTokens();
      setUser(null);
      setActiveOrganizationId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const rt = localStorage.getItem("refreshToken");
    if (!rt) {
      setLoading(false);
      return;
    }
    setTokens("", rt);
    api
      .post<{ accessToken: string; refreshToken: string; expiresAt: string }>("/auth/refresh", {
        refreshToken: rt,
      })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken);
        return fetchMe();
      })
      .then(() => fetchOrganizations())
      .catch(() => {
        clearTokens();
        setUser(null);
        setActiveOrganizationId(null);
        setLoading(false);
      });
  }, [fetchMe, fetchOrganizations]);

  const finalizeAuthenticated = useCallback(
    async (data: { accessToken: string; refreshToken: string }) => {
      setTokens(data.accessToken, data.refreshToken);
      // Fetch profile + organizations in parallel to avoid a sequential
      // round-trip waterfall right after login.
      await Promise.all([fetchMe(), fetchOrganizations()]);
    },
    [fetchMe, fetchOrganizations],
  );

  // A login/OTP/Google/select-org call returns one of four steps: an MFA
  // challenge, a mandatory MFA setup, an org-selection picker, or the final
  // token pair. Resolve them all the same way so every sign-in method shares
  // identical handling.
  const resolveAuthStep = useCallback(
    async (data: AuthStepResponse, fallbackEmail: string): Promise<LoginResult> => {
      if (data.orgSelectionRequired) {
        return {
          step: "org-selection",
          selectionToken: data.selectionToken ?? "",
          organizations: data.organizations ?? [],
          user: { email: data.user?.email ?? fallbackEmail },
        };
      }
      if (data.mfaRequired) {
        return {
          step: "mfa",
          mfaChallenge: data.mfaChallenge ?? "",
          user: { email: data.user?.email ?? fallbackEmail },
        };
      }
      if (data.mfaSetupRequired) {
        setTokens(data.mfaSetupToken ?? "", "");
        return {
          step: "mfa-setup",
          mfaSetupToken: data.mfaSetupToken ?? "",
          user: { email: data.user?.email ?? fallbackEmail },
        };
      }
      await finalizeAuthenticated({
        accessToken: data.accessToken ?? "",
        refreshToken: data.refreshToken ?? "",
      });
      return {
        step: "done",
        accessToken: data.accessToken ?? "",
        refreshToken: data.refreshToken ?? "",
      };
    },
    [finalizeAuthenticated],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const data = await api.post<AuthStepResponse>("/auth/login", { email, password });
      return resolveAuthStep(data, email);
    },
    [resolveAuthStep],
  );

  const completeMfaLogin = useCallback(
    async (challenge: string, code: string) => {
      const data = await api.post<LoginResponse>("/auth/mfa/complete-login", { challenge, code });
      await finalizeAuthenticated(data);
    },
    [finalizeAuthenticated],
  );

  const requestLoginCode = useCallback(async (email: string) => {
    return api.post<LoginCodeDelivery>("/auth/login-otp/request", { email });
  }, []);

  const verifyLoginCode = useCallback(
    async (email: string, code: string): Promise<LoginResult> => {
      const data = await api.post<AuthStepResponse>("/auth/login-otp/verify", { email, code });
      return resolveAuthStep(data, email);
    },
    [resolveAuthStep],
  );

  const requestPhoneLoginCode = useCallback(async (phone: string) => {
    return api.post<PhoneLoginCodeDelivery>("/auth/login-otp/request-phone", { phone });
  }, []);

  const verifyPhoneLoginCode = useCallback(
    async (phone: string, code: string): Promise<LoginResult> => {
      const data = await api.post<AuthStepResponse>("/auth/login-otp/verify-phone", {
        phone,
        code,
      });
      return resolveAuthStep(data, "");
    },
    [resolveAuthStep],
  );

  const completeOAuthLogin = useCallback(
    async (grant: string): Promise<LoginResult> => {
      const data = await api.post<AuthStepResponse>("/auth/oauth/exchange", { grant });
      return resolveAuthStep(data, data.user?.email ?? "");
    },
    [resolveAuthStep],
  );

  const selectOrganization = useCallback(
    async (selectionToken: string, orgId: string): Promise<LoginResult> => {
      const data = await api.post<AuthStepResponse>("/auth/select-org", {
        selectionToken,
        orgId,
      });
      return resolveAuthStep(data, data.user?.email ?? "");
    },
    [resolveAuthStep],
  );

  const mfaStatus = useCallback(async () => {
    return api.get<MfaStatus>("/auth/mfa/status");
  }, []);

  const startMfaEnroll = useCallback(async () => {
    return api.post<MfaEnrollResult>("/auth/mfa/enroll", {});
  }, []);

  const confirmMfaEnroll = useCallback(
    async (secret: string, code: string) => {
      const data = await api.post<{
        backupCodes: string[];
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: string;
      }>("/auth/mfa/verify", { secret, code });
      if (data.accessToken) {
        await finalizeAuthenticated({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? "",
        });
      }
      return { backupCodes: data.backupCodes };
    },
    [finalizeAuthenticated],
  );

  const regenerateMfaBackupCodes = useCallback(async (code: string) => {
    return api.post<MfaEnrollConfirmResult>("/auth/mfa/regenerate-backup-codes", { code });
  }, []);

  const disableMfa = useCallback(async (code: string) => {
    await api.post("/auth/mfa/disable", { code });
  }, []);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationName: string;
      organizationCode: string;
      phone?: string;
    }) => {
      const data = await api.post<RegisterResponse>("/auth/register", input);
      if (data.requiresEmailVerification) {
        return {
          requiresEmailVerification: true,
          email: input.email,
          maskedEmail: data.verification?.maskedEmail,
          deliveredVia: data.verification?.deliveredVia,
        };
      }
      await signIn(input.email, input.password);
      return { requiresEmailVerification: false, email: input.email };
    },
    [signIn],
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    await api.post<{ message: string }>("/auth/verify-email", { email, code });
  }, []);

  const resendVerification = useCallback(
    async (email: string, purpose?: "EMAIL_VERIFICATION" | "PASSWORD_RESET") => {
      const data = await api.post<{
        maskedEmail: string;
        expiresInSeconds: number;
        deliveredVia: string;
      }>("/auth/resend-verification", { email, purpose });
      return data;
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await api.post("/auth/logout", {});
      }
    } catch {
      // best-effort network call; always clear local session
    } finally {
      clearTokens();
      setUser(null);
      setActiveOrganizationId(null);
      setOrganizations([]);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const data = await api.post<{
      message: string;
      maskedEmail: string | null;
      expiresInSeconds?: number;
    }>("/auth/forgot-password", { email });
    return { maskedEmail: data.maskedEmail ?? null };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await api.post<{ message: string }>("/auth/reset-password", { email, code, newPassword });
  }, []);

  const resendInvite = useCallback(async (email: string) => {
    return api.post<OtpDelivery>("/auth/resend-invite", { email });
  }, []);

  const acceptInvite = useCallback(async (email: string, code: string, password: string) => {
    await api.post<{ message: string }>("/auth/accept-invite", { email, code, password });
  }, []);

  const switchOrganization = useCallback(
    async (orgId: string): Promise<LoginResult> => {
      const data = await api.post<AuthStepResponse>(`/auth/switch-organization/${orgId}`, {});
      const result = await resolveAuthStep(data, data.user?.email ?? "");
      if (result.step === "done") {
        window.dispatchEvent(new CustomEvent("org-switch", { detail: { orgId } }));
      } else if (result.step === "mfa") {
        pendingSwitchStep = { kind: "mfa", challenge: result.mfaChallenge };
        clearTokens();
        setUser(null);
        setActiveOrganizationId(null);
      } else if (result.step === "mfa-setup") {
        pendingSwitchStep = { kind: "mfa-setup" };
        setUser(null);
        setActiveOrganizationId(null);
      }
      return result;
    },
    [resolveAuthStep],
  );

  const value: AuthCtx = {
    user,
    loading,
    isSuperAdmin: user?.isSuperAdmin === true,
    organizations,
    activeOrganizationId,
    signIn,
    completeMfaLogin,
    requestLoginCode,
    verifyLoginCode,
    requestPhoneLoginCode,
    verifyPhoneLoginCode,
    completeOAuthLogin,
    selectOrganization,
    mfaStatus,
    startMfaEnroll,
    confirmMfaEnroll,
    regenerateMfaBackupCodes,
    disableMfa,
    signUp,
    verifyEmail,
    resendVerification,
    signOut,
    forgotPassword,
    resetPassword,
    resendInvite,
    acceptInvite,
    switchOrganization,
    refreshOrganizations: fetchOrganizations,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
