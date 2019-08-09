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
interface MixedOptions extends APIOptions, DocumentOptions {}
type MixedOptionsOrDocumentID = MixedOptions | DocumentID;
interface TerminusDocument {
  _links: {};
}
type Callback<E, T> = (err?: E, result?: T) => void;
type Done<T> = Callback<ProgressEvent | Error, T>;

// This built JS asset _will_be_ rewritten on-the-fly, so we need to obscure the origin somewhat
const GENIUNE_MEDIA_ENDPOINT_PATTERN = new RegExp(['http', '://', 'mpegmedia', '.abc.net.au'].join(''), 'g');
const PROXIED_MEDIA_ENDPOINT = 'https://abcmedia.akamaized.net';
const PREVIEW_HOSTNAME = 'aus.aunty.abc.net.au';
const TERMINUS_LIVE_ENDPOINT = 'https://api.abc.net.au/terminus';
const TERMINUS_PREVIEW_ENDPOINT = 'https://api-preview.terminus.abc-prod.net.au';
const IS_PREVIEW = window.location.hostname.indexOf(PREVIEW_HOSTNAME) > -1;
const HAS_LIVE_FLAG = window.location.search.indexOf('prod') > -1;
const TERMINUS_ENV_BASED_ENDPOINT = !IS_PREVIEW || HAS_LIVE_FLAG ? TERMINUS_LIVE_ENDPOINT : TERMINUS_PREVIEW_ENDPOINT;
const DEFAULT_API_OPTIONS: APIOptions = {
  apikey: '54564fe299e84f46a57057266fcf233b'
};
const DEFAULT_DOCUMENT_OPTIONS: DocumentOptions = {
  source: 'coremedia',
  type: 'article'
};

function fetchOne(mixedOptions: MixedOptionsOrDocumentID): Promise<TerminusDocument>;
function fetchOne(mixedOptions: MixedOptionsOrDocumentID, done: Done<TerminusDocument>): void;
function fetchOne(mixedOptions: MixedOptionsOrDocumentID, done?: Done<TerminusDocument>): any {
  return asyncTask(
    new Promise((resolve, reject) => {
      const { source, type, id, apikey, isTeasable, forceLive, forcePreview } = {
        ...DEFAULT_API_OPTIONS,
        ...DEFAULT_DOCUMENT_OPTIONS,
        ...ensureIsDocumentOptions(mixedOptions)
      };

      if (isDocumentIDInvalid(id)) {
        return reject(new Error(`Invalid ID: ${id}`));
      }

      request(
        `${getEndpoint(forceLive, forcePreview)}/api/v1/${
          isTeasable ? 'teasable' : ''
        }content/${source}/${type}/${id}?apikey=${apikey}`,
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
  documentsOptions: DocumentOptionsOrDocumentID[],
  apiOptions?: APIOptions,
  done?: Done<TerminusDocument[]>
): any {
  return asyncTask(
    new Promise((resolve, reject) => {
      const _documentsOptions = (documentsOptions || []).map(documentOptions => ({
        ...DEFAULT_DOCUMENT_OPTIONS,
        ...ensureIsDocumentOptions(documentOptions)
      }));
      const invalidID = _documentsOptions.map(({ id }) => id).find(isDocumentIDInvalid);

      if (invalidID) {
        return reject(new Error(`Invalid ID: ${invalidID}`));
      }

      const { apikey, forceLive, forcePreview, isTeasable } = {
        ...DEFAULT_API_OPTIONS,
        ...(apiOptions || <APIOptions>{})
      };

      request(
        `${getEndpoint(forceLive, forcePreview)}/api/v1/${
          isTeasable ? 'teasable' : ''
        }content?ids=${_documentsOptions
          .map(({ source, type, id }) => `${source}://${type}/${id}`)
          .join(',')}&apikey=${apikey}`,
        response => resolve(response._embedded && response._embedded.content),
        reject
      );
    }),
    done
  );
}

function asyncTask(promise: Promise<any>, callback?: Callback<any, any>) {
  if (callback) {
    promise.then(result => setTimeout(callback, 0, null, result)).catch(err => setTimeout(callback, 0, err));
  } else {
    return promise;
  }
}

function ensureIsDocumentOptions(options: DocumentOptionsOrDocumentID): DocumentOptions {
  return typeof options === 'string' || typeof options === 'number' ? { id: options } : options;
}

function isDocumentIDInvalid(documentID: DocumentID): boolean {
  return documentID != +documentID && !String(documentID).length;
}

function getEndpoint(forceLive: boolean, forcePreview: boolean): string {
  return forceLive ? TERMINUS_LIVE_ENDPOINT : forcePreview ? TERMINUS_PREVIEW_ENDPOINT : TERMINUS_ENV_BASED_ENDPOINT;
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

export default fetchOne;
export { fetchOne, fetchMany };
