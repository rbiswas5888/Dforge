const FIGMA_FILE_PATH = /^\/(?:file|design|proto)\/([a-zA-Z0-9_-]+)(?:\/|$)/;

export function extractFigmaFileKey(fileUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    throw new Error('Enter a valid Figma file URL.');
  }

  if (parsedUrl.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(parsedUrl.hostname)) {
    throw new Error('Use an HTTPS Figma file, design, or prototype URL.');
  }

  const match = parsedUrl.pathname.match(FIGMA_FILE_PATH);
  if (!match) {
    throw new Error('The Figma URL must include a file, design, or prototype key.');
  }
  return match[1];
}

export async function fetchFigmaFile(fileUrl, accessToken, fetchImpl = globalThis.fetch) {
  const fileKey = extractFigmaFileKey(fileUrl);
  const token = String(accessToken || '').trim();
  if (!token) throw new Error('Enter a Figma personal access token.');
  if (typeof fetchImpl !== 'function') throw new Error('Network requests are unavailable in this environment.');

  const response = await fetchImpl(`https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Figma-Token': token
    }
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Figma API returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const apiMessage = typeof payload?.err === 'string' ? payload.err : '';
    throw new Error(apiMessage
      ? `Figma API request failed (HTTP ${response.status}): ${apiMessage}`
      : `Figma API request failed (HTTP ${response.status}). Check the token and file access.`);
  }
  if (!payload?.document || payload.document.type !== 'DOCUMENT') {
    throw new Error('Figma API response did not contain a design document.');
  }

  return { fileKey, fileData: payload };
}
