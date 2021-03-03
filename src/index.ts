import { TIERS, getTier } from '@abcnews/env-utils';

type DocumentID = string | number;
type APIVersions = 'v1' | 'v2';
interface APIOptions {
  apikey?: string;
  force?: TIERS;
  version?: APIVersions;
  isTeasable?: boolean;
}
export interface DocumentOptions {
  source?: string;
  type?: string;
  id?: DocumentID;
}
type DocumentOptionsOrDocumentID = DocumentOptions | DocumentID;
interface FetchOneOptions extends APIOptions, DocumentOptions {}
type FetchOneOptionsOrDocumentID = FetchOneOptions | DocumentID;
interface SearchOptions extends APIOptions {
  source?: string;
  [x: string]: any;
}
interface TerminusDocument {
  _links?: {};
  _embedded?: {
    [key: string]: TerminusDocument[];
  };
}
type Callback<E, T> = (err?: E, result?: T) => void;
type Done<T> = Callback<ProgressEvent | Error, T>;

type CropData = {
  cropHeight: number;
  cropWidth: number;
  x: number;
  y: number;
};

type CropsData = {
  [key: string]: CropData;
};

// This built JS asset _will_be_ rewritten on-the-fly, so we need to obscure the origin somewhat
const GENIUNE_MEDIA_ENDPOINT_PATTERN = new RegExp(['http', '://', 'mpegmedia', '.abc.net.au'].join(''), 'g');
const PROXIED_MEDIA_ENDPOINT = 'https://abcmedia.akamaized.net';
const TERMINUS_LIVE_ENDPOINT = 'https://api.abc.net.au/terminus';
const TERMINUS_PREVIEW_ENDPOINT = 'https://api-preview.terminus.abc-prod.net.au';
const IMAGE_LIVE_ENDPOINT = 'https://live-production.wcms.abc-cdn.net.au';
const IMAGE_PREVIEW_ENDPOINT = 'https://preview-production.wcms.abc-cdn.net.au';
const DEFAULT_API_OPTIONS: APIOptions = {
  apikey: '54564fe299e84f46a57057266fcf233b',
  version: 'v2'
};
const DEFAULT_DOCUMENT_OPTIONS: DocumentOptions = {
  source: 'coremedia',
  type: 'article'
};
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  ...DEFAULT_API_OPTIONS,
  source: DEFAULT_DOCUMENT_OPTIONS.source
};

// the base url is the domain and path including the version
function getBaseUrl({ force, version }: DocumentOptions & APIOptions): string {
  const queryMatch = window.location.search.match(/terminusBaseURL=(https:\/\/[^&]+)/);
  return queryMatch ? queryMatch[1] : `${getEndpoint(force)}/api/${version}`;
}

// The endpoint is the domain and path to the API, excluding the version
function getEndpoint(force?: TIERS): string {
  return (getTier() === TIERS.PREVIEW || force === TIERS.PREVIEW) && force !== TIERS.LIVE
    ? TERMINUS_PREVIEW_ENDPOINT
    : TERMINUS_LIVE_ENDPOINT;
}

function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID): Promise<TerminusDocument>;
function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID, done: Done<TerminusDocument>): void;
function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID, done?: Done<TerminusDocument>): any {
  return asyncTask(
    new Promise((resolve, reject) => {
      const { source, type, id, apikey, isTeasable, force, version } = {
        ...DEFAULT_API_OPTIONS,
        ...DEFAULT_DOCUMENT_OPTIONS,
        ...ensureIsDocumentOptions(fetchOneOptions)
      };

      if (isDocumentIDInvalid(id as DocumentID)) {
        return reject(new Error(`Invalid ID: ${id}`));
      }

      request(
        `${getBaseUrl({ force, version })}/${
          isTeasable ? 'teasable' : ''
        }content/${source}/${type}/${id}?apikey=${apikey}`,
        resolve,
        reject
      );
    }),
    done
  );
}

function search(searchOptions: SearchOptions): Promise<TerminusDocument[]>;
function search(searchOptions: SearchOptions, done: Done<TerminusDocument[]>): void;
function search(searchOptions?: SearchOptions, done?: Done<TerminusDocument[]>): any {
  return asyncTask(
    new Promise((resolve, reject) => {
      const { apikey, force, source, version, ...searchParams } = {
        ...DEFAULT_SEARCH_OPTIONS,
        ...(searchOptions || ({} as SearchOptions))
      };
      const searchParamsKeys = Object.keys(searchParams);

      request(
        `${getBaseUrl({ force, version })}/search/${source}?${searchParamsKeys
          .map(key => `${key}=${searchParams[key]}`)
          .join('&')}${searchParamsKeys.length ? '&' : ''}apikey=${apikey}`,
        (response: TerminusDocument) => resolve(response._embedded && flattenEmbeddedProps(response._embedded)),
        reject
      );
    }),
    done
  );
}

// Enable easy support for both promise and callback interfaces
function asyncTask(promise: Promise<any>, callback?: Callback<any, any>) {
  return callback
    ? promise.then(result => setTimeout(callback, 0, null, result)).catch(err => setTimeout(callback, 0, err))
    : promise;
}

function ensureIsDocumentOptions(options: DocumentOptionsOrDocumentID): DocumentOptions {
  return typeof options === 'string' || typeof options === 'number' ? { id: options } : options;
}

function isDocumentIDInvalid(documentID: DocumentID): boolean {
  return documentID != +documentID || !String(documentID).length || String(documentID).indexOf('.') > -1;
}

function request(uri: string, resolve: Function, reject: Function) {
  const xhr = new XMLHttpRequest();
  const errorHandler = (event: ProgressEvent) => reject(event);
  console.log('uri :>> ', uri);
  xhr.onload = event => (xhr.status !== 200 ? reject(event) : resolve(parse(xhr.responseText)));
  xhr.onabort = errorHandler;
  xhr.onerror = errorHandler;
  xhr.open('GET', uri, true);
  xhr.responseType = 'text';
  xhr.send();
}

function parse(responseText: string): TerminusDocument {
  // Terminus is not returning proxied asset URLs (yet)
  return JSON.parse(responseText.replace(GENIUNE_MEDIA_ENDPOINT_PATTERN, PROXIED_MEDIA_ENDPOINT));
}

function flattenEmbeddedProps(_embedded: { [key: string]: TerminusDocument[] }) {
  return Object.keys(_embedded).reduce((memo, key) => memo.concat(_embedded[key]), [] as TerminusDocument[]);
}

// Generates ABC CDN's Akamai crop/resize image binary URLs
// This is only relevant for Terminus v2 data
function getImageRendition(binaryKey: string, crop: CropData, targetWidth: number, force?: TIERS): string {
  const ratio = crop.cropHeight / crop.cropWidth;
  const endpoint =
    (getTier() === TIERS.PREVIEW || force === TIERS.PREVIEW) && force !== TIERS.LIVE
      ? IMAGE_PREVIEW_ENDPOINT
      : IMAGE_LIVE_ENDPOINT;
  return `${endpoint}/${binaryKey}?impolicy=wcms_crop_resize&cropH=${crop.cropHeight}&cropW=${crop.cropWidth}&xPos=${
    crop.x
  }&yPos=${crop.y}&width=${targetWidth}&height=${Math.round(targetWidth * ratio)}`;
}

type ImageRendition = { width: number; ratio: string; url: string };

function getImageRenditions(
  binaryKey: string,
  crops: CropsData,
  targetWidths: number[],
  force?: TIERS
): ImageRendition[] {
  const result: ImageRendition[] = [];
  Object.keys(crops).forEach(ratio => {
    targetWidths.forEach(targetWidth => {
      result.push({
        url: getImageRendition(binaryKey, crops[ratio], targetWidth, force),
        width: targetWidth,
        ratio: ratio
      });
    });
  });
  return result;
}

export default fetchOne;
export { fetchOne, search, getImageRendition, getImageRenditions };
