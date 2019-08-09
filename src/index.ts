interface Options {
  source?: string;
  type?: string;
  id?: ID;
  apikey?: string;
  forceLive?: boolean;
  forcePreview?: boolean;
}

type ID = string | number;
type OptionsOrID = Options | ID;
type Callback<E, T> = (err?: E, result?: T) => void;
type Done = Callback<ProgressEvent | Error, Object>;

// This built JS asset _will_be_ rewritten on-the-fly, so we need to obscure the origin somewhat
const GENIUNE_MEDIA_ENDPOINT_PATTERN = new RegExp(['http', '://', 'mpegmedia', '.abc.net.au'].join(''), 'g');
const PROXIED_MEDIA_ENDPOINT = 'https://abcmedia.akamaized.net';
const PREVIEW_HOSTNAME = 'aus.aunty.abc.net.au';
const TERMINUS_LIVE_ENDPOINT = 'https://api.abc.net.au/terminus';
const TERMINUS_PREVIEW_ENDPOINT = 'https://api-preview.terminus.abc-prod.net.au';
const IS_PREVIEW = window.location.hostname.indexOf(PREVIEW_HOSTNAME) > -1;
const HAS_LIVE_FLAG = window.location.search.indexOf('prod') > -1;
const TERMINUS_ENV_BASED_ENDPOINT = !IS_PREVIEW || HAS_LIVE_FLAG ? TERMINUS_LIVE_ENDPOINT : TERMINUS_PREVIEW_ENDPOINT;
const DEFAULT_OPTIONS: Options = {
  source: 'coremedia',
  type: 'article',
  apikey: '54564fe299e84f46a57057266fcf233b'
};

function ensureIsOptions(options: OptionsOrID): Options {
  return typeof options === 'string' || typeof options === 'number' ? { id: options } : options;
}

function terminusFetch(options: OptionsOrID): Promise<Object>;
function terminusFetch(options: OptionsOrID, done: Done): void;
function terminusFetch(options: OptionsOrID, done?: Done): any {
  return asyncTask(
    new Promise((resolve, reject) => {
      const { source, type, id, apikey, forceLive, forcePreview } = { ...DEFAULT_OPTIONS, ...ensureIsOptions(options) };

      if (id != +id && !String(id).length) {
        return reject(new Error(`Invalid ID: ${id}`));
      }

      const endpoint = forceLive
        ? TERMINUS_LIVE_ENDPOINT
        : forcePreview
        ? TERMINUS_PREVIEW_ENDPOINT
        : TERMINUS_ENV_BASED_ENDPOINT;
      const uri = `${endpoint}/api/v1/content/${source}/${type}/${id}?apikey=${apikey}`;
      const xhr = new XMLHttpRequest();
      const errorHandler = (event: ProgressEvent) => reject(event);

      xhr.onload = event => (xhr.status !== 200 ? reject(event) : resolve(parse(xhr.responseText)));
      xhr.onabort = errorHandler;
      xhr.onerror = errorHandler;
      xhr.open('GET', uri, true);
      xhr.responseType = 'text';
      xhr.send();
    }),
    done
  );
}

function parse(responseText: string): Object {
  // Terminus is not returning proxied asset URLs (yet)
  return JSON.parse(responseText.replace(GENIUNE_MEDIA_ENDPOINT_PATTERN, PROXIED_MEDIA_ENDPOINT));
}

function asyncTask(promise: Promise<any>, callback?: Callback<any, any>) {
  if (callback) {
    promise.then(result => setTimeout(callback, 0, null, result)).catch(err => setTimeout(callback, 0, err));
  } else {
    return promise;
  }
}

export default terminusFetch;
