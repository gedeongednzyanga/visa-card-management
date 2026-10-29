// Stockage des jetons JWT de l'API dans des cookies httpOnly.
export const ACCESS_COOKIE = "access_token"
export const REFRESH_COOKIE = "refresh_token"

type CookieOptions = {
  httpOnly: boolean
  secure: boolean
  sameSite: "lax"
  path: string
  maxAge: number
}

// Compatible avec cookies() de next/headers et NextResponse.cookies.
type CookieStore = {
  set(name: string, value: string, options: CookieOptions): unknown
  delete(name: string): unknown
}

// Lit la date d'expiration (en secondes) d'un JWT sans vérifier sa signature :
// la vérification est faite par l'API.
export function tokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
    return typeof payload.exp === "number" ? payload.exp : 0
  } catch {
    return 0
  }
}

export function isTokenExpired(token: string, skewSeconds = 10) {
  return tokenExpiry(token) - skewSeconds <= Date.now() / 1000
}

function optionsFor(token: string): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, Math.floor(tokenExpiry(token) - Date.now() / 1000)),
  }
}

export function setSessionCookies(
  store: CookieStore,
  tokens: { accessToken: string; refreshToken: string }
) {
  store.set(ACCESS_COOKIE, tokens.accessToken, optionsFor(tokens.accessToken))
  store.set(REFRESH_COOKIE, tokens.refreshToken, optionsFor(tokens.refreshToken))
}

export function clearSessionCookies(store: CookieStore) {
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
}
