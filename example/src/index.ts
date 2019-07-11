import terminusFetch from '../../src';

const OPTIONS = [
  10736062,
  { id: 10735012, type: 'imageproxy' },
  { id: 10734902, type: 'video' },
  { id: 123860, type: 'show', source: 'iview' }
];

OPTIONS.forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[env] options=${JSON.stringify(options)}`, err, doc))
);
OPTIONS.forEach(options =>
  terminusFetch(options, (err, doc) => console.log(`[live] options=${JSON.stringify(options)}`, err, doc), true)
);
OPTIONS.forEach(options =>
  terminusFetch(
    options,
    (err, doc) => console.log(`[preview] options=${JSON.stringify(options)}`, err, doc),
    null,
    true
  )
);
