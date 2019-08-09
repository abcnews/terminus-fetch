import terminusFetch from '../../src';

const OPTIONS = [
  10736062,
  { id: 10735012, type: 'imageproxy', isTeasable: true },
  { id: 10734902, type: 'video' },
  { id: 123860, type: 'show', source: 'iview' }
];

function ensureObject(options) {
  return typeof options === 'object' ? options : { id: options };
}

// Using callbacks
OPTIONS.forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[env] options=${JSON.stringify(options)}`, err, doc))
);
OPTIONS.map(x => ({ ...ensureObject(x), forceLive: true })).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[live] options=${JSON.stringify(options)}`, err, doc))
);
OPTIONS.map(x => ({ ...ensureObject(x), forcePreview: true })).forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[preview] options=${JSON.stringify(options)}`, err, doc))
);

// Using promises
OPTIONS.forEach(options => {
  terminusFetch(options)
    .then(doc => console.log(`[env resolved] options=${JSON.stringify(options)}`, doc))
    .catch(err => console.log('[env rejected]', err));
});

terminusFetch(1241241241241245125125125125)
  .then(doc => console.log(`[error? resolved]`, doc))
  .catch(err => console.log('[error? rejected]', err));
