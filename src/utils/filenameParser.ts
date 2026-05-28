export interface FilenameMetadata {
  alias: string | null;
  designName: string | null;
  designId: string | null;
}

/**
 * Parses PMO-style design document filenames.
 * Pattern: {시스템}_{업무알리아스}_{...}_{번호}_{설계명칭}(설계명칭({설계ID}))_{버전}.{확장자}
 * Example: HFC_LCR_PD_DS_03_화면(보고서)설계서(설계명칭(UI_LRC_0021))_V0.5.xlsx
 */
export function parseFilenameMetadata(fileName: string): FilenameMetadata {
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');

  // 업무 알리아스: 2nd underscore-separated segment
  const parts = nameWithoutExt.split('_');
  const alias = parts.length >= 2 ? parts[1] : null;

  // 설계ID: content inside (설계명칭({id}))
  const designIdMatch = nameWithoutExt.match(/\(설계명칭\(([^)]+)\)\)/);
  const designId = designIdMatch ? designIdMatch[1] : null;

  // 설계명칭: last underscore segment before (설계명칭(
  let designName: string | null = null;
  const idx = nameWithoutExt.indexOf('(설계명칭(');
  if (idx !== -1) {
    const before = nameWithoutExt.substring(0, idx);
    const segments = before.split('_');
    const last = segments[segments.length - 1];
    if (last) designName = last;
  }

  return { alias, designName, designId };
}
