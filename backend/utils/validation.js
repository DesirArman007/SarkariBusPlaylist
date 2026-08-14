export const isValidExternalUrl = (urlString) => {
  if (!urlString) return true;
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      'localhost', '127.0.0.1', '0.0.0.0',
      '169.254.', '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
      '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
      '[::1]', 'metadata.google', '169.254.169.254'
    ];
    for (const pattern of blockedPatterns) {
      if (hostname === pattern || hostname.startsWith(pattern)) return false;
    }
    return true;
  } catch {
    return false;
  }
};
