import { fetchOne, getImages, search } from './index';

import * as v2_standard_complete from './test-data/v2-standard-complete';
import * as v2_standard_proxy from './test-data/v2-standard-proxy';
import * as v2_standard_proxy_with_default_ratio from './test-data/v2-standard-proxy-with-default-ratio';

describe('getImages', () => {
  describe('Terminus v2', () => {
    test('Standard image with all relevant fields complete', () => {
      expect(getImages(v2_standard_complete.input)).toEqual(v2_standard_complete.result);
    });
    test('Standard image proxy with all relevant fields complete', () => {
      expect(getImages(v2_standard_proxy.input)).toEqual(v2_standard_proxy.result);
    });
    test('Standard image proxy with defaultRatio', () => {
      expect(getImages(v2_standard_proxy_with_default_ratio.input).defaultRatio).toEqual('4x3');
    });
    test('Bad terminus doc', () => {
      expect(() => getImages({})).toThrow();
    });
  });
});

describe('fetchOne', () => {
  const originalFetch = global.fetch;
  const mockApiKey = 'test-api-key-123';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test.each([['string', '12345'], ['number', 12345]])(
    'constructs correct URL with document ID as %s',
    async (_, id) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        text: async () => JSON.stringify({ id: 12345 })
      });

      await fetchOne(id, mockApiKey);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.abc.net.au/terminus/api/v2/content/coremedia/article/12345?apikey=${mockApiKey}`
      );
    }
  );

  test('constructs correct URL with custom source, type, and teasable flag', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: async () => JSON.stringify({ id: 12345 })
    });

    await fetchOne(
      {
        id: 12345,
        source: 'custom-source',
        type: 'video',
        isTeasable: true
      },
      mockApiKey
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.abc.net.au/terminus/api/v2/teasablecontent/custom-source/video/12345?apikey=${mockApiKey}`
    );
  });

  test('throws error on invalid document ID', async () => {
    await expect(fetchOne('invalid.id', mockApiKey)).rejects.toThrow('Invalid ID: invalid.id');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('search', () => {
  const originalFetch = global.fetch;
  const mockApiKey = 'test-api-key-123';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('constructs correct URL with search options and params', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        results: [{ id: 1 }, { id: 2 }]
      })
    });

    const results = await search(
      {
        source: 'coremedia',
        pageSize: 10,
        query: 'news'
      },
      mockApiKey
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.abc.net.au/terminus/api/v2/search/coremedia?pageSize=10&query=news&apikey=${mockApiKey}`
    );
    expect(results).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

