import { TIERS, getTier } from '@abcnews/env-utils';
import { getImages } from './lib/images';

type DocumentID = string | number;
type APIVersions = 'v2';
interface APIOptions {
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
  [x: string]: unknown;
}
export interface TerminusDocument {
  _links?: Record<string, unknown>;
  _embedded?: {
    [key: string]: TerminusDocument[];
  };
}

// This built JS asset _will_be_ rewritten on-the-fly, so we need to obscure the origin somewhat
const GENIUNE_MEDIA_ENDPOINT_PATTERN = new RegExp(['http', '://', 'mpegmedia', '.abc.net.au'].join(''), 'g');
const PROXIED_MEDIA_ENDPOINT = 'https://abcmedia.akamaized.net';
const API_KEY = (() => {
  try {
    return process.env.TERMINUS_FETCH_API_KEY;
  } catch (e) {
    // modern build tools don't support this and must specify a key via the
    // function args or class.
    return '';
  }
})();
const TERMINUS_LIVE_ENDPOINT = 'https://api.abc.net.au/terminus';
const TERMINUS_PREVIEW_ENDPOINT = 'https://api-preview.terminus.abc-prod.net.au';
const DEFAULT_API_OPTIONS: APIOptions = {
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
  const url = new URL(window.location.toString());
  const base = url.searchParams.get('terminusBaseURL');
  return base ? base.replace('.private', '') : `${getEndpoint(force)}/api/${version}`;
}

// The endpoint is the domain and path to the API, excluding the version
function getEndpoint(force?: TIERS): string {
  return (getTier() === TIERS.PREVIEW || force === TIERS.PREVIEW) && force !== TIERS.LIVE
    ? TERMINUS_PREVIEW_ENDPOINT
    : TERMINUS_LIVE_ENDPOINT;
}

function validateKey(apiKey = '') {
  if (!apiKey) {
    console.warn(
      '[terminus-fetch] No Terminus API key provided. Requests will fail until you set the TERMINUS_FETCH_API_KEY environment variable.'
    );
  }
}

async function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID, apiKey = API_KEY): Promise<TerminusDocument> {
  const { source, type, id, isTeasable, force, version } = {
    ...DEFAULT_API_OPTIONS,
    ...DEFAULT_DOCUMENT_OPTIONS,
    ...ensureIsDocumentOptions(fetchOneOptions)
  };

  if (isDocumentIDInvalid(id as DocumentID)) {
    throw new Error(`Invalid ID: ${id}`);
  }

  validateKey(apiKey);

  const res = await fetch(
    `${getBaseUrl({ force, version })}/${isTeasable ? 'teasable' : ''}content/${source}/${type}/${id}?apikey=${apiKey}`
  );
  const responseText = await res.text();
  return parse(responseText);
}

async function search(searchOptions: SearchOptions, apiKey = API_KEY): Promise<TerminusDocument[]> {
  const { force, source, version, ...searchParams } = {
    ...DEFAULT_SEARCH_OPTIONS,
    ...(searchOptions || ({} as SearchOptions))
  };
  const searchParamsKeys = Object.keys(searchParams);

  validateKey(apiKey);
  const res = await fetch(
    `${getBaseUrl({ force, version })}/search/${source}?${searchParamsKeys
      .map(key => `${key}=${searchParams[key]}`)
      .join('&')}${searchParamsKeys.length ? '&' : ''}apikey=${apiKey}`
  );
  const _embedded = await res.json();
  return flattenEmbeddedProps(_embedded);
}

function ensureIsDocumentOptions(options: DocumentOptionsOrDocumentID): DocumentOptions {
  return typeof options === 'string' || typeof options === 'number' ? { id: options } : options;
}

function isDocumentIDInvalid(documentID: DocumentID): boolean {
  return documentID != +documentID || !String(documentID).length || String(documentID).indexOf('.') > -1;
}

function parse(responseText: string): TerminusDocument {
  // Terminus is not returning proxied asset URLs (yet)
  return JSON.parse(responseText.replace(GENIUNE_MEDIA_ENDPOINT_PATTERN, PROXIED_MEDIA_ENDPOINT));
}

function flattenEmbeddedProps(_embedded: Record<string, TerminusDocument[]>) {
  return Object.keys(_embedded).reduce((memo, key) => memo.concat(_embedded[key]), [] as TerminusDocument[]);
}

export { fetchOne, search, getImages };
