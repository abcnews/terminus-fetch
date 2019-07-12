interface Options {
  source?: string;
  type?: string;
  id?: string | number;
  apikey?: string;
  forceLive?: boolean;
  forcePreview?: boolean;
}

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

function ensureIsOptions(options: string | number | Options): Options {
  return typeof options === 'string' || typeof options === 'number' ? { id: options } : options;
}

function terminusFetch(
  options: string | number | Options,
  done: (err?: ProgressEvent | Error, doc?: Object) => void
): void;
function terminusFetch(options: string | number | Options): Promise<Object>;
function terminusFetch(options, done?): any {
  const { source, type, id, apikey, forceLive, forcePreview } = { ...DEFAULT_OPTIONS, ...ensureIsOptions(options) };

  if (id != +id && !String(id).length) {
    const error = new Error(`Invalid ID: ${id}`);
    return typeof done === 'function' ? done(error) : Promise.reject(error);
  }

  const endpoint = forceLive
    ? TERMINUS_LIVE_ENDPOINT
    : forcePreview
    ? TERMINUS_PREVIEW_ENDPOINT
    : TERMINUS_ENV_BASED_ENDPOINT;
  const uri = `${endpoint}/api/v1/content/${source}/${type}/${id}?apikey=${apikey}`;
  const xhr = new XMLHttpRequest();

  if (typeof done === 'function') {
    const errorHandler = (event: ProgressEvent) => done(event);

    xhr.onload = event => (xhr.status !== 200 ? done(event) : done(undefined, parse(xhr.responseText)));
    xhr.onabort = errorHandler;
    xhr.onerror = errorHandler;
    xhr.open('GET', uri, true);
    xhr.responseType = 'text';
    xhr.send();
  } else {
    return new Promise<Object>((resolve, reject) => {
      xhr.onload = event => {
        if (xhr.status !== 200) {
          reject(event);
        } else {
          resolve(parse(xhr.responseText));
        }
      };
      xhr.onabort = reject;
      xhr.onerror = reject;
      xhr.open('GET', uri, true);
      xhr.responseType = 'text';
      xhr.send();
    });
  }
}

function parse(responseText: string): Object {
  // Terminus is not returning proxied asset URLs (yet)
  return JSON.parse(responseText.replace(GENIUNE_MEDIA_ENDPOINT_PATTERN, PROXIED_MEDIA_ENDPOINT));
}

export default terminusFetch;
