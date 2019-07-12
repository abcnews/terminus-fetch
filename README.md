# @abcnews/terminus-fetch

Grab a document from the Preview / Live Terminus content API, based on the current execution domain

```sh
$ npm i @abcnews/terminus-fetch
```

## Usage

```js
import terminusFetch from '@abcnews/terminus-fetch';

// By default, we assume you want an Article docment from
// Core Media, using News' API key, so you can pass a CMID:

terminusFetch(10736062, (err, doc) => {
  if (!err) {
    console.log(doc);
    // > { id: 10736062, docType: "Article", contentSource: "coremedia", ...}
  }
});

// ...or you can pass an options object to override the defaults (see API below):

terminusFetch({ id: 10734902, type: 'video' }, (err, doc) => {
  if (!err) {
    console.log(doc);
    // > {id: 10734902, docType: "Video", contentSource: "coremedia", ...}
  }
});

terminusFetch({ id: 123860, type: 'show', source: 'iview' }, (err, doc) => {
  if (!err) {
    console.log(doc);
    // > {id: 123860, docType: "show", contentSource: "iview", ...}
  }
});
```

If your project's JS is currently executing in a page on `aus.aunty.abc.net.au`, requests will be made to Preview Terminus (`https://api-preview.terminus.abc-prod.net.au/api/v1/content/*`), otherwise they'll be made to Live Terminus (`https://api.abc.net.au/terminus/api/v1/content/*`).

If you want to direct a single request to Live Terminus, regardless of the current execution domain, pass `forceLive: true` as an option.

If you want to direct a single request to Preview Terminus, regardless of the current execution domain, pass `forcePreview: true` as an option.

### API

```ts
declare function terminusFetch(
  options:
    | string
    | number
    | {
        source?: string;
        type?: string;
        id?: string | number;
        apikey?: string;
        forceLive?: boolean;
        forcePreview?: boolean;
      },
  done?: (err?: ProgressEvent | Error, doc?: Object) => void
): void | Promise<Object>;
```

If the `done` callback is omitted then the return value will be a Promise.

#### Default options

```js
{
  source: 'coremedia',
  type: 'article',
  id: undefined,
  apikey: '54564fe299e84f46a57057266fcf233b' /* (News) */
}
```

## Developing

To run the `/example` project:

1. Start the development server with: `npm start`
2. Visit `http:<machine_name>.aus.aunty.abc.net.au:8080`
3. Open the browser's development console

For testing purposes, you can direct all requests to Live Terminus by appending `?prod=1` to your current page URL.

### Releasing

`npm run release` will handle version bumping, git pushing and npm publication for you.

## Authors

- Colin Gourlay ([Gourlay.Colin@abc.net.au](mailto:Gourlay.Colin@abc.net.au))
