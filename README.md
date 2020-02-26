# @abcnews/terminus-fetch

Fetch one or more documents from the Preview / Live Terminus content API, based on the current execution domain

```sh
$ npm i @abcnews/terminus-fetch
```

## Usage

```js
import { fetchOne, search } from '@abcnews/terminus-fetch';
// We export fetchOne by default, as it's most commmonly used:
import fetchOne from '@abcnews/terminus-fetch';

// By default, we assume you want an Article docment from
// Core Media, using News' API key, so you can pass a CMID:

fetchOne(10736062, (err, doc) => {
  if (!err) {
    console.log(doc);
    // > { id: 10736062, docType: "Article", contentSource: "coremedia", ... }
  }
});

// ...or you can pass an options object to override the defaults (see API below):

fetchOne({ id: 10734902, type: 'video' }, (err, doc) => {
  if (!err) {
    console.log(doc);
    // > {id: 10734902, docType: "Video", contentSource: "coremedia", ... }
  }
});

// You can use promises instead of callbacks:

fetchOne({ id: 123860, type: 'show', source: 'iview' })
  .then(doc => {
    console.log(doc);
    // > { id: 123860, docType: "show", contentSource: "iview", ... }
  })
  .catch(err => console.error(err));

// Searching is also supported:

search({ limit: 3, doctype: 'image' }), (err, docs) => {
  if (!err) {
    console.log(docs);
    // > [
    //     { id: 11405582, docType: "Image", contentSource: "coremedia", ... },
    //     { id: 11404970, docType: "Image", contentSource: "coremedia", ... },
    //     { id: 11405258, docType: "Image", contentSource: "coremedia", ... }
    //   ]
  }
});

// ...for all sources...:

search({ limit: 1, source: 'mapi', service: 'triplej'})
  .then(docs => {
    console.log(docs);
    // > [
    //     { id: "maaYa1B4YP", docType: "Artist", ... },
    //     { id: "mpr9PpbkRd", docType: "Play", ... },
    //     { id: "mtOKj2DbNK", docType: "Recording", ... },
    //     { id: "mrDXgzL4Ry", docType: "Release", ... }
    //   ]
  })
  .catch(err => console.error(err));
```

If your project's JS is currently executing in a page on `aus.aunty.abc.net.au`, requests will be made to Preview Terminus (`https://api-preview.terminus.abc-prod.net.au/api/v1/{teasable}content`), otherwise they'll be made to Live Terminus (`https://api.abc.net.au/terminus/api/v1/{teasable}content`).

If you want to direct a single request to Live Terminus, regardless of the current execution domain, pass `forceLive: true` as an option.

If you want to direct a single request to Preview Terminus, regardless of the current execution domain, pass `forcePreview: true` as an option.

If you want only need a document's metadata (e.g. an article without full text content), pass `isTeasable: true` as an option and the document will be fetched from the `/teasablecontent/` API, instead of the `/content/` API.

## API

### `fetchOne`

```ts
declare function fetchOne(
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
        isTeasable?: string;
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
  apikey: '54564fe299e84f46a57057266fcf233b' /* (News) */
}
```

### `search`

```ts
declare function search(
  options: {
    source?: string;
    apikey?: string;
    forceLive?: boolean;
    forcePreview?: boolean;
    ...searchParams: Object;
  },
  done?: (err?: ProgressEvent | Error, doc?: Object) => void
): void | Promise<Object>;
```

...where your `searchParams` are additional properties on your `options` object, to query the API.

For example, if you wanted the last 20 images added to Core Media, your `searchParams` would be:

```js
{
  limit: 20,
  doctype: 'image'
}
```

If the `done` callback is omitted then the return value will be a Promise.

#### Default options

These are the same as `fetchOne`, only split across two options arguments.

## Developing

To run the `/example` project:

1. Start the development server with: `npm start`
2. Visit `http:<machine_name>.aus.aunty.abc.net.au:8080`
3. Open the browser's development console

### Releasing

`npm run release` will handle version bumping, git pushing and npm publication for you.

## Authors

- Colin Gourlay ([Gourlay.Colin@abc.net.au](mailto:Gourlay.Colin@abc.net.au))
