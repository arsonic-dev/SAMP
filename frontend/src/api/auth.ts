import api from './axios'

export interface TenantRegistrationResponse {
  tenantId: string
  name: string
  clientId: string
  clientSecret: string
}

export interface RegisterResponse {
  tenantId: string
  userId: string
  email: string
  mfaEnabled: boolean
  totpSecret: string
  totpProvisioningUri: string
  createdAt: string
}

export interface LoginResponse {
  mfaRequired: boolean
  challengeToken: string | null
  challengeTokenExpiresAt: string | null
  tokens: TokenResponse | null
}

export interface TokenResponse {
  tenantId: string
  tokenType: string
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
}

/** Parse the userId from the JWT `sub` claim. Returns '' if unparseable. */
export function parseUserIdFromJwt(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? ''
  } catch {
    return ''
  }
}

/** Parse role from JWT claims. Falls back to 'USER'. */
export function parseRoleFromJwt(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.roles?.[0] ?? payload.role ?? 'USER'
  } catch {
    return 'USER'
  }
}

export const authApi = {
  /** Step 1: Register a tenant (org) */
  registerTenant: (name: string) =>
    api.post<TenantRegistrationResponse>('/tenants/register', {
      name,
      allowedScopes: ['openid', 'profile'],
      redirectUris: ['http://localhost:5173/callback'],
    }),

  /** Step 2: Register a user under that tenant */
  registerUser: (tenantId: string, email: string, password: string) =>
    api.post<RegisterResponse>('/auth/register', {
      tenantId,
      email,
      password,
      mfaEnabled: true,
    }),

  /** Step 3: Login — returns MFA challenge or direct tokens */
  login: (tenantId: string, email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { tenantId, email, password }),

  /** Step 4: Verify MFA TOTP code. Returns TokenResponse. */
  mfaVerify: (challengeToken: string, code: string) =>
    api.post<TokenResponse>('/auth/mfa/verify', { challengeToken, code }),

  /** Refresh access token using refresh token */
  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refreshToken }),

  /** Logout — revokes the refresh token */
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
}
