import terminusFetch, { fetchOne, fetchMany } from '../../src';

const OPTIONS = [
  10736062,
  { id: 10735012, type: 'imageproxy' },
  { id: 10734902, type: 'video' },
  { id: 123860, type: 'show', source: 'iview' }
];
const TEASABLE_OPTIONS_MIXIN = {
  isTeasable: true
};

function ensureObject(options) {
  return typeof options === 'object' ? options : { id: options };
}

// Using callbacks
OPTIONS.forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[env] options=${JSON.stringify(options)}`, err, doc))
);
OPTIONS.map(x => ({ ...ensureObject(x), ...TEASABLE_OPTIONS_MIXIN })).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[env:teasable] options=${JSON.stringify(options)}`, err, doc))
);
OPTIONS.map(x => ({ ...ensureObject(x), forceLive: true })).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[live] options=${JSON.stringify(options)}`, err, doc))
);
OPTIONS.map(x => ({ ...ensureObject(x), forcePreview: true })).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[preview] options=${JSON.stringify(options)}`, err, doc))
);
fetchMany(OPTIONS, null, (err, doc) => console.log(`[many][env] options=${JSON.stringify(OPTIONS)};null`, err, doc));

// Using promises
OPTIONS.forEach(options => {
  fetchOne(options)
    .then(doc => console.log(`[env resolved] options=${JSON.stringify(options)}`, doc))
    .catch(err => console.log('[env rejected]', err));
});
fetchMany(OPTIONS, TEASABLE_OPTIONS_MIXIN)
  .then(doc =>
    console.log(
      `[many][env:teasable resolved] options=${JSON.stringify(OPTIONS)};${JSON.stringify(TEASABLE_OPTIONS_MIXIN)}`,
      doc
    )
  )
  .catch(err => console.log('[many][env:teasable rejected]', err));

terminusFetch(1241241241241245125125125125)
  .then(doc => console.log(`[error? resolved]`, doc))
  .catch(err => console.log('[error? rejected]', err));
