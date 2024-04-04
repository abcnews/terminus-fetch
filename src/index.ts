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
interface TerminusDocument {
  _links?: Record<string, unknown>;
  _embedded?: {
    [key: string]: TerminusDocument[];
  };
}
type Callback<E, T> = (err?: E, result?: T) => void;
type Done<T> = Callback<ProgressEvent | Error, T>;

// This built JS asset _will_be_ rewritten on-the-fly, so we need to obscure the origin somewhat
const GENIUNE_MEDIA_ENDPOINT_PATTERN = new RegExp(['http', '://', 'mpegmedia', '.abc.net.au'].join(''), 'g');
const PROXIED_MEDIA_ENDPOINT = 'https://abcmedia.akamaized.net';
const API_KEY = process.env.TERMINUS_FETCH_API_KEY;
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

function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID): Promise<TerminusDocument>;
function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID, done: Done<TerminusDocument>): void;
function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID, done?: Done<TerminusDocument>): unknown {
  return asyncTask(
    new Promise<TerminusDocument>((resolve, reject) => {
      const { source, type, id, isTeasable, force, version } = {
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
        }content/${source}/${type}/${id}?apikey=${API_KEY}`,
        resolve,
        reject
      );
    }),
    done
  );
}

function search(searchOptions: SearchOptions): Promise<TerminusDocument[]>;
function search(searchOptions: SearchOptions, done: Done<TerminusDocument[]>): void;
function search(searchOptions?: SearchOptions, done?: Done<TerminusDocument[]>): unknown {
  return asyncTask(
    new Promise<TerminusDocument[]>((resolve, reject) => {
      const { force, source, version, ...searchParams } = {
        ...DEFAULT_SEARCH_OPTIONS,
        ...(searchOptions || ({} as SearchOptions))
      };
      const searchParamsKeys = Object.keys(searchParams);

      request(
        `${getBaseUrl({ force, version })}/search/${source}?${searchParamsKeys
          .map(key => `${key}=${searchParams[key]}`)
          .join('&')}${searchParamsKeys.length ? '&' : ''}apikey=${API_KEY}`,
        (response: TerminusDocument) => resolve(flattenEmbeddedProps(response._embedded || {})),
        reject
      );
    }),
    done
  );
}

// Enable easy support for both promise and callback interfaces
function asyncTask<E, T>(promise: Promise<T>, callback?: Callback<E, T>) {
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

function request(uri: string, resolve: (data: TerminusDocument) => unknown, reject: (err: ProgressEvent) => unknown) {
  const xhr = new XMLHttpRequest();
  const errorHandler = (event: ProgressEvent) => reject(event);

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

function flattenEmbeddedProps(_embedded: Record<string, TerminusDocument[]>) {
  return Object.keys(_embedded).reduce((memo, key) => memo.concat(_embedded[key]), [] as TerminusDocument[]);
}

if (!API_KEY) {
  console.warn(
    '[terminus-fetch] No Terminus API key provided. Requests will fail until you set the TERMINUS_FETCH_API_KEY environment variable.'
  );
}

export { fetchOne, search, getImages };
