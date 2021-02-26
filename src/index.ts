import { TIERS, getTier } from '@abcnews/env-utils';

type DocumentID = string | number;
interface APIOptions {
  apikey?: string;
  forceLive?: boolean;
  forcePreview?: boolean;
  isTeasable?: boolean;
}
interface DocumentOptions {
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

// This built JS asset _will_be_ rewritten on-the-fly, so we need to obscure the origin somewhat
const GENIUNE_MEDIA_ENDPOINT_PATTERN = new RegExp(['http', '://', 'mpegmedia', '.abc.net.au'].join(''), 'g');
const PROXIED_MEDIA_ENDPOINT = 'https://abcmedia.akamaized.net';
const TERMINUS_LIVE_ENDPOINT = 'https://api.abc.net.au/terminus';
const TERMINUS_PREVIEW_ENDPOINT = 'https://api-preview.terminus.abc-prod.net.au';
const DEFAULT_API_OPTIONS: APIOptions = {
  apikey: '54564fe299e84f46a57057266fcf233b'
};
const DEFAULT_DOCUMENT_OPTIONS: DocumentOptions = {
  source: 'coremedia',
  type: 'article'
};
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  ...DEFAULT_API_OPTIONS,
  source: DEFAULT_DOCUMENT_OPTIONS.source
};

function getVersion({ source, id }: DocumentOptions & { id: DocumentID }): string {
  // Until Terminus V2 is used exclusively, we only need to send requests to it for CM10 content (id >= 100000000)
  return source === 'coremedia' && (typeof id === 'number' ? id : parseInt(id, 10)) >= 1e8 ? 'v2' : 'v1';
}

function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID): Promise<TerminusDocument>;
function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID, done: Done<TerminusDocument>): void;
function fetchOne(fetchOneOptions: FetchOneOptionsOrDocumentID, done?: Done<TerminusDocument>): any {
  return asyncTask(
    new Promise((resolve, reject) => {
      const { source, type, id, apikey, isTeasable, forceLive, forcePreview } = {
        ...DEFAULT_API_OPTIONS,
        ...DEFAULT_DOCUMENT_OPTIONS,
        ...ensureIsDocumentOptions(fetchOneOptions)
      };

      if (isDocumentIDInvalid(id as DocumentID)) {
        return reject(new Error(`Invalid ID: ${id}`));
      }

      request(
        `${getEndpoint(forceLive, forcePreview)}/api/${getVersion({
          source,
          id: id as DocumentID
        })}/${isTeasable ? 'teasable' : ''}content/${source}/${type}/${id}?apikey=${apikey}`,
        resolve,
        reject
      );
    }),
    done
  );
}

function fetchMany(
  documentsOptions: DocumentOptionsOrDocumentID[],
  apiOptions: APIOptions
): Promise<TerminusDocument[]>;
function fetchMany(
  documentsOptions: DocumentOptionsOrDocumentID[],
  apiOptions: APIOptions,
  done: Done<TerminusDocument[]>
): void;
function fetchMany(
  _documentsOptions: DocumentOptionsOrDocumentID[],
  _apiOptions?: APIOptions,
  done?: Done<TerminusDocument[]>
): any {
  return asyncTask(Promise.reject(new Error('The `fetchMany` function is no longer supported')), done);
}

function search(searchOptions: SearchOptions): Promise<TerminusDocument[]>;
function search(searchOptions: SearchOptions, done: Done<TerminusDocument[]>): void;
function search(searchOptions?: SearchOptions, done?: Done<TerminusDocument[]>): any {
  return asyncTask(
    new Promise((resolve, reject) => {
      const { apikey, forceLive, forcePreview, source, ...searchParams } = {
        ...DEFAULT_SEARCH_OPTIONS,
        ...(searchOptions || ({} as SearchOptions))
      };
      const searchParamsKeys = Object.keys(searchParams);

      request(
        `${getEndpoint(forceLive, forcePreview)}/api/v1/search/${source}?${searchParamsKeys
          .map(key => `${key}=${searchParams[key]}`)
          .join('&')}${searchParamsKeys.length ? '&' : ''}apikey=${apikey}`,
        (response: TerminusDocument) => resolve(response._embedded && flattenEmbeddedProps(response._embedded)),
        reject
      );
    }),
    done
  );
}

function asyncTask(promise: Promise<any>, callback?: Callback<any, any>) {
  if (!callback) {
    return promise;
  }

  return promise.then(result => setTimeout(callback, 0, null, result)).catch(err => setTimeout(callback, 0, err));
}

function ensureIsDocumentOptions(options: DocumentOptionsOrDocumentID): DocumentOptions {
  return typeof options === 'string' || typeof options === 'number' ? { id: options } : options;
}

function isDocumentIDInvalid(documentID: DocumentID): boolean {
  return documentID != +documentID || !String(documentID).length || String(documentID).indexOf('.') > -1;
}

function getEndpoint(forceLive?: boolean, forcePreview?: boolean): string {
  return forceLive
    ? TERMINUS_LIVE_ENDPOINT
    : forcePreview
    ? TERMINUS_PREVIEW_ENDPOINT
    : getTier() !== TIERS.PREVIEW
    ? TERMINUS_LIVE_ENDPOINT
    : TERMINUS_PREVIEW_ENDPOINT;
}

function request(uri: string, resolve: Function, reject: Function) {
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

function flattenEmbeddedProps(_embedded: { [key: string]: TerminusDocument[] }) {
  return Object.keys(_embedded).reduce((memo, key) => memo.concat(_embedded[key]), [] as TerminusDocument[]);
}

export default fetchOne;
export { fetchOne, fetchMany, search };
