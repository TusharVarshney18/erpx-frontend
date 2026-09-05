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

export type LoginResult =
  | { mfaRequired: true; mfaChallenge: string; user: { email: string } }
  | { mfaRequired: false; accessToken: string; refreshToken: string };

export type LoginCodeDelivery = {
  maskedEmail: string | null;
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

type SwitchOrgResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: { id: string; email: string; isSuperAdmin?: boolean };
  session: { id: string; createdAt: string };
  organization: OrganizationInfo;
};

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
  completeOAuthLogin: (grant: string) => Promise<LoginResult>;
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
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  isSuperAdmin: false,
  organizations: [],
  activeOrganizationId: null,
  signIn: async () => ({ mfaRequired: false, accessToken: "", refreshToken: "" }),
  completeMfaLogin: async () => {},
  requestLoginCode: async () => ({ maskedEmail: null, deliveredVia: "console" }),
  verifyLoginCode: async () => ({ mfaRequired: false, accessToken: "", refreshToken: "" }),
  completeOAuthLogin: async () => ({ mfaRequired: false, accessToken: "", refreshToken: "" }),
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
  switchOrganization: async () => {},
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
      const profile = await api.get<UserProfile>("/auth/me");
      setUser(profile);
      setActiveOrganizationId(profile.organization.id);
      await fetchOrganizations();
    },
    [fetchOrganizations],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const data = await api.post<LoginResponse & { mfaRequired?: boolean; mfaChallenge?: string }>(
        "/auth/login",
        { email, password },
      );
      if (data.mfaRequired) {
        return { mfaRequired: true, mfaChallenge: data.mfaChallenge ?? "", user: { email } };
      }
      await finalizeAuthenticated(data);
      return { mfaRequired: false, accessToken: data.accessToken, refreshToken: data.refreshToken };
    },
    [finalizeAuthenticated],
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
      const data = await api.post<LoginResponse & { mfaRequired?: boolean; mfaChallenge?: string }>(
        "/auth/login-otp/verify",
        { email, code },
      );
      if (data.mfaRequired) {
        return { mfaRequired: true, mfaChallenge: data.mfaChallenge ?? "", user: { email } };
      }
      await finalizeAuthenticated(data);
      return { mfaRequired: false, accessToken: data.accessToken, refreshToken: data.refreshToken };
    },
    [finalizeAuthenticated],
  );

  const completeOAuthLogin = useCallback(
    async (grant: string): Promise<LoginResult> => {
      const data = await api.post<LoginResponse & { mfaRequired?: boolean; mfaChallenge?: string }>(
        "/auth/oauth/exchange",
        { grant },
      );
      if (data.mfaRequired) {
        return {
          mfaRequired: true,
          mfaChallenge: data.mfaChallenge ?? "",
          user: { email: data.user?.email ?? "" },
        };
      }
      await finalizeAuthenticated(data);
      return { mfaRequired: false, accessToken: data.accessToken, refreshToken: data.refreshToken };
    },
    [finalizeAuthenticated],
  );

  const mfaStatus = useCallback(async () => {
    return api.get<MfaStatus>("/auth/mfa/status");
  }, []);

  const startMfaEnroll = useCallback(async () => {
    return api.post<MfaEnrollResult>("/auth/mfa/enroll", {});
  }, []);

  const confirmMfaEnroll = useCallback(async (secret: string, code: string) => {
    return api.post<MfaEnrollConfirmResult>("/auth/mfa/verify", { secret, code });
  }, []);

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

  const switchOrganization = useCallback(async (orgId: string) => {
    const data = await api.post<SwitchOrgResponse>(`/auth/switch-organization/${orgId}`, {});
    setTokens(data.accessToken, data.refreshToken);
    setActiveOrganizationId(data.organization.id);
    const profile = await api.get<UserProfile>("/auth/me");
    setUser(profile);
    window.dispatchEvent(
      new CustomEvent("org-switch", { detail: { orgId: data.organization.id } }),
    );
  }, []);

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
    completeOAuthLogin,
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
