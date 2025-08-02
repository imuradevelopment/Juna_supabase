/**
 * HEXカラーをRGB値に変換する
 * @param hex - HEXカラーコード（#付き）
 * @returns RGB値の文字列（例: "255 255 255"）
 */
export function hexToRgb(hex: string): string {
  // #を削除
  hex = hex.replace('#', '');
  
  // 3桁の場合は6桁に拡張
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // RGB値を計算
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `${r} ${g} ${b}`;
}

/**
 * RGB値をHEXカラーに変換する
 * @param rgb - RGB値の文字列（例: "255 255 255"）
 * @returns HEXカラーコード（#付き）
 */
export function rgbToHex(rgb: string): string {
  const [r, g, b] = rgb.split(' ').map(Number);
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}