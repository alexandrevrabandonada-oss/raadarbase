const ANDROID_USER_AGENT_PATTERN = /\bAndroid\b/i;

export type InstagramLaunchTarget = {
  url: string;
  opensExternalTab: boolean;
};

export function normalizeInstagramUsername(username: string) {
  return username.trim().replace(/^@+/, "");
}

export function buildInstagramProfileUrl(username: string) {
  const normalizedUsername = normalizeInstagramUsername(username);
  return `https://www.instagram.com/${encodeURIComponent(normalizedUsername)}/`;
}

export function buildInstagramAndroidIntentUrl(username: string) {
  const normalizedUsername = normalizeInstagramUsername(username);
  const fallbackUrl = buildInstagramProfileUrl(normalizedUsername);

  return (
    `intent://www.instagram.com/${encodeURIComponent(normalizedUsername)}/` +
    "#Intent;scheme=https;package=com.instagram.android;" +
    `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`
  );
}

export function getInstagramLaunchTarget(
  username: string,
  userAgent: string,
): InstagramLaunchTarget {
  if (ANDROID_USER_AGENT_PATTERN.test(userAgent)) {
    return {
      url: buildInstagramAndroidIntentUrl(username),
      opensExternalTab: false,
    };
  }

  return {
    url: buildInstagramProfileUrl(username),
    opensExternalTab: true,
  };
}

/**
 * Mantém o Radar vivo no Android enquanto o app do Instagram assume a tela.
 * Em outros sistemas, preserva o comportamento de abrir o perfil em nova aba.
 * Deve ser chamado diretamente por um gesto do usuário para o Chrome permitir
 * que o Intent abra o aplicativo externo.
 */
export function launchInstagramProfile(username: string) {
  const target = getInstagramLaunchTarget(username, window.navigator.userAgent);

  if (target.opensExternalTab) {
    window.open(target.url, "_blank", "noopener,noreferrer");
    return;
  }

  window.location.assign(target.url);
}
