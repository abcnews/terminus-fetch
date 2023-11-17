const DEFAULT_TARGET_WIDTHS = [160, 240, 480, 700, 940, 1400, 2150];

type ImageData = {
  cmid: string;
  title?: string;
  alt?: string;
  caption?: string;
  attribution?: string;
  canonicalURL: string;
  defaultRatio?: string;
  renditions: ImageRendition[];
};
type ImageRendition = { width: number; height: number; ratio: string; url: string; isUndersizedBinary: boolean };

type TerminusImageDocument = {
  id: string;
  title?: string;
  alt?: string;
  caption?: string;
  defaultRatio?: string;
  byLine?: {
    plain: string;
  };
  canonicalURL: string;
  media: {
    image: {
      primary: {
        binaryKey: string;
        ratios: TerminusImageDocumentRatios;
        complete: { url: string }[];
      };
    };
  };
};
type TerminusImageDocumentRatios = {
  [key: string]: TerminusCropData;
};

type TerminusCropData = {
  cropHeight: number;
  cropWidth: number;
  x: number;
  y: number;
};

const extractEndpoint = (url: string) => {
  const match = url.match(/https:\/\/[^/]+/);
  if (!match) throw new Error('Could not determine image CDN endpoint');
  return match[0];
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isTerminusImageDocumentRatios = (obj: unknown): obj is TerminusImageDocumentRatios => {
  if (!isObject(obj)) return false;
  for (const key in obj) {
    const nestedObj = obj[key];
    if (!isObject(nestedObj)) return false;
    if (typeof nestedObj.cropWidth !== 'number') return false;
    if (typeof nestedObj.cropHeight !== 'number') return false;
    if (typeof nestedObj.x !== 'number') return false;
    if (typeof nestedObj.y !== 'number') return false;
  }
  return true;
};

const isTerminusImageDocument = (obj: unknown): obj is TerminusImageDocument => {
  if (!isObject(obj)) return false;
  if (obj.docType !== 'Image' && obj.docType !== 'ImageProxy') return false;
  if (typeof obj.id !== 'string') return false;
  if (!isObject(obj.media)) return false;
  if (!isObject(obj.media.image)) return false;
  if (!isObject(obj.media.image.primary)) return false;
  if (typeof obj.media.image.primary.binaryKey !== 'string') return false;
  if (!Array.isArray(obj.media.image.primary.complete)) return false;
  if (typeof obj.media.image.primary.complete[0]?.url !== 'string') return false;
  if (!isTerminusImageDocumentRatios(obj?.media?.image?.primary?.ratios)) return false;
  return true;
};

// Generates ABC CDN's Akamai crop/resize image binary URLs
// This is only relevant for Terminus v2 data
function generateImageRenditionURL(
  binaryKey: string,
  crop: TerminusCropData,
  targetWidth: number,
  endpoint: string
): string {
  const ratio = crop.cropHeight / crop.cropWidth;
  return `${endpoint}/${binaryKey}?impolicy=wcms_crop_resize&cropH=${crop.cropHeight}&cropW=${crop.cropWidth}&xPos=${
    crop.x
  }&yPos=${crop.y}&width=${targetWidth}&height=${Math.round(targetWidth * ratio)}`;
}

function generateImageRenditions(
  binaryKey: string,
  crops: TerminusImageDocumentRatios,
  targetWidths: number[] = DEFAULT_TARGET_WIDTHS,
  endpoint: string
): ImageRendition[] {
  const result: ImageRendition[] = [];
  Object.keys(crops).forEach(ratio => {
    targetWidths.forEach(targetWidth => {
      result.push({
        url: generateImageRenditionURL(binaryKey, crops[ratio], targetWidth, endpoint),
        width: targetWidth,
        height: Math.round(targetWidth * (crops[ratio].cropHeight / crops[ratio].cropWidth)),
        ratio: ratio,
        isUndersizedBinary: crops[ratio].cropWidth < targetWidth
      });
    });
  });
  return result;
}

function getImages(doc: unknown, targetWidths: number[] = DEFAULT_TARGET_WIDTHS): ImageData {
  if (isTerminusImageDocument(doc)) {
    const { title, alt, id, caption, canonicalURL, defaultRatio } = doc;
    return {
      cmid: id,
      title,
      alt,
      caption,
      attribution: doc.byLine?.plain,
      canonicalURL,
      defaultRatio,
      renditions: generateImageRenditions(
        doc.media.image.primary.binaryKey,
        doc.media.image.primary.ratios,
        targetWidths,
        extractEndpoint(doc.media.image.primary.complete[0].url)
      )
    };
  }

  if (isLegacyTerminusImageDocument(doc)) {
    const images = doc.media.image.primary.complete;
    const { title, alt, id: cmid, caption, attribution, canonicalURL } = doc;
    return {
      alt,
      cmid,
      title,
      caption,
      attribution,
      canonicalURL,
      renditions: images.map(({ ratio, width, height, url }) => {
        return {
          ratio: ratio || getRatioString(width, height),
          width,
          height,
          url,
          isUndersizedBinary: false
        };
      })
    };
  }

  throw new Error('The document passed was not a valid terminus image document');
}

/*
 * ========================================================
 * Stuff below here is transitional and can be removed once
 * the transition to CM10 and Terminus v2 is complete.
 * ========================================================
 */
type LegacyTerminusImageDocument = {
  id: string;
  title?: string;
  alt?: string;
  caption?: string;
  attribution?: string;
  canonicalURL: string;
  media: {
    image: {
      primary: {
        complete: LegacyTerminusImageDocumentImages;
      };
    };
  };
};

type LegacyTerminusImageDocumentImages = LegacyTerminusImageDocumentImage[];
type LegacyTerminusImageDocumentImage = {
  width: number;
  height: number;
  url: string;
  ratio?: string;
};

const greatestCommonFactor = (a: number, b: number) => {
  while (a) {
    const t = a;
    a = b % a;
    b = t;
  }
  return b;
};

const getRatioString = (width: number, height: number) => {
  const gcf = greatestCommonFactor(width, height);
  return `${width / gcf}x${height / gcf}`;
};

const isLegacyTerminusImageDocument = (obj: unknown): obj is LegacyTerminusImageDocument => {
  if (!isObject(obj)) return false;
  if (obj.docType !== 'Image' && obj.docType !== 'ImageProxy' && obj.docType !== 'CustomImage') return false;
  if (typeof obj.id !== 'string') return false;
  if (!isObject(obj.media)) return false;
  if (!isObject(obj.media.image)) return false;
  if (!isObject(obj.media.image.primary)) return false;
  if (!isLegacyTerminusImageDocumentImages(obj.media.image.primary.complete)) return false;
  return true;
};

const isLegacyTerminusImageDocumentImage = (obj: unknown): obj is LegacyTerminusImageDocumentImage => {
  if (!isObject(obj)) return false;
  if (typeof obj.width !== 'number') return false;
  if (typeof obj.height !== 'number') return false;
  if (typeof obj.url !== 'string') return false;
  return true;
};

const isLegacyTerminusImageDocumentImages = (obj: unknown): obj is LegacyTerminusImageDocumentImages => {
  if (!Array.isArray(obj)) return false;
  if (!obj.every(isLegacyTerminusImageDocumentImage)) return false;
  return true;
};

export { getImages };
