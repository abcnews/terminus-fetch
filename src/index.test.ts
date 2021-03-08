import { getImages } from './index';

import * as v2_standard_complete from './test-data/v2-standard-complete';
import * as v2_standard_proxy from './test-data/v2-standard-proxy';

import * as v1_standard_complete from './test-data/v1-standard-complete';
import * as v1_custom_complete from './test-data/v1-custom-complete';
import * as v1_standard_proxy_title_update from './test-data/v1-standard-proxy-title-update';

describe('getImages', () => {
  describe('Terminus v2', () => {
    test('Standard image with all relevant fields complete', () => {
      expect(getImages(v2_standard_complete.input)).toEqual(v2_standard_complete.result);
    });
    test('Standard image proxy with all relevant fields complete', () => {
      expect(getImages(v2_standard_proxy.input)).toEqual(v2_standard_proxy.result);
    });
  });
  describe('Terminus v1', () => {
    test('Standard image with all the relevant fields complete', () => {
      expect(getImages(v1_standard_complete.input)).toEqual(v1_standard_complete.result);
    });
    test('Standard image proxy with an updated title', () => {
      expect(getImages(v1_standard_proxy_title_update.input)).toEqual(v1_standard_proxy_title_update.result);
    });
    test('Custom image with all the relevant fields complete', () => {
      expect(getImages(v1_custom_complete.input)).toEqual(v1_custom_complete.result);
      expect(getImages(v1_custom_complete.input, [100, 200])).toEqual(v1_custom_complete.result);
    });
  });
});
