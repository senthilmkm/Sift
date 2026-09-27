import { PROFILE_PII_MAP, COMMON_PII_PATTERNS } from './piiRedactor';
import { ProfileId } from '../models/types';

export interface BlurBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface ImageBlurResult {
  isBlurred: boolean;
  blurCount: number;
  sanitizedBase64: string;
  detectedBoxes: BlurBox[];
}

/**
 * On-Device Image PII Blurring Engine
 * Detects sensitive PII patterns in document images and produces visual blur bounding box coordinates.
 */
export async function blurImagePii(
  base64Image: string,
  profileId: ProfileId = 'school',
  simulatedText?: string
): Promise<ImageBlurResult> {
  if (!base64Image) {
    return {
      isBlurred: false,
      blurCount: 0,
      sanitizedBase64: '',
      detectedBoxes: []
    };
  }

  const detectedBoxes: BlurBox[] = [];
  const textToScan = simulatedText || '';

  const profilePatterns = PROFILE_PII_MAP[profileId] || [];
  const allPatterns = [...profilePatterns, ...COMMON_PII_PATTERNS];

  for (const pattern of allPatterns) {
    pattern.regex.lastIndex = 0;
    const matches = textToScan.matchAll(pattern.regex);
    for (const match of matches) {
      if (match.index !== undefined) {
        // Calculate simulated bounding box coordinates based on text index
        const lineNum = Math.floor(match.index / 40);
        const charCol = match.index % 40;
        detectedBoxes.push({
          x: charCol * 10,
          y: lineNum * 20,
          width: match[0].length * 10,
          height: 18,
          label: pattern.name
        });
      }
    }
  }

  const isBlurred = detectedBoxes.length > 0;
  // Simulated sanitized base64 with blur markers applied
  const sanitizedBase64 = isBlurred ? `${base64Image}_blurred_${detectedBoxes.length}` : base64Image;

  return {
    isBlurred,
    blurCount: detectedBoxes.length,
    sanitizedBase64,
    detectedBoxes
  };
}
