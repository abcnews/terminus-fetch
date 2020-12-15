import terminusFetch, { fetchOne, fetchMany, search } from '../../src/index';

const FETCH_OPTIONS = [
  10736062,
  { id: 10735012, type: 'imageproxy' },
  { id: 10734902, type: 'video' },
  { id: 123860, type: 'show', source: 'iview' }
];
const FETCH_OPTIONS_TEASABLE_MIXIN = {
  isTeasable: true
};
const SEARCH_OPTIONS = [
  {
    limit: 10,
    doctype: 'image'
  },
  {
    limit: 10,
    source: 'mapi',
    service: 'triplej'
  }
];

function ensureObject(options) {
  return typeof options === 'object' ? options : { id: options };
}

// Using callbacks
FETCH_OPTIONS.forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[env] options=${JSON.stringify(options)}`, err, doc))
);
FETCH_OPTIONS.map(x => ({
  ...ensureObject(x),
  ...FETCH_OPTIONS_TEASABLE_MIXIN
})).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[env:teasable] options=${JSON.stringify(options)}`, err, doc))
);
FETCH_OPTIONS.map(x => ({
  ...ensureObject(x),
  forceLive: true
})).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[live] options=${JSON.stringify(options)}`, err, doc))
);
FETCH_OPTIONS.map(x => ({
  ...ensureObject(x),
  forcePreview: true
})).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[preview] options=${JSON.stringify(options)}`, err, doc))
);

// Using promises
FETCH_OPTIONS.forEach(options => {
  fetchOne(options)
    .then(doc => console.log(`[env resolved] options=${JSON.stringify(options)}`, doc))
    .catch(err => console.log('[env rejected]', err));
});

// Using an invalid id (floating point number)
terminusFetch(1241241241241245125125125125)
  .then(doc => console.log(`[error? resolved]`, doc))
  .catch(err => console.log('[error? rejected]', err));

// Search
SEARCH_OPTIONS.forEach(options =>
  search(options)
    .then(docs => console.log(`[search][env resolved] options=${JSON.stringify(options)}`, docs))
    .catch(err => console.log('[search][env rejected]', err))
);

// Deprecated `fetchMany` function. Should reject

fetchMany(null, null, err => console.log('[fetchMany][env rejected]', err));
fetchMany(null, null).catch(err => console.log('[fetchMany][env rejected]', err));
