import { getImages } from './index';

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
