import { TIERS } from '@abcnews/env-utils';
import { getImageRendition, getImageRenditions } from './index';

enum RESULTS {
  BIG_16X9_LIVE = 'https://live-production.wcms.abc-cdn.net.au/key?impolicy=wcms_crop_resize&cropH=360&cropW=640&xPos=0&yPos=0&width=862&height=485',
  BIG_16X9_PREVIEW = 'https://preview-production.wcms.abc-cdn.net.au/key?impolicy=wcms_crop_resize&cropH=360&cropW=640&xPos=0&yPos=0&width=862&height=485',
  SMALL_16X9_LIVE = 'https://live-production.wcms.abc-cdn.net.au/key?impolicy=wcms_crop_resize&cropH=360&cropW=640&xPos=0&yPos=0&width=100&height=56',
  BIG_1X1_LIVE = 'https://live-production.wcms.abc-cdn.net.au/key?impolicy=wcms_crop_resize&cropH=405&cropW=405&xPos=117&yPos=0&width=862&height=862',
  SMALL_1X1_LIVE = 'https://live-production.wcms.abc-cdn.net.au/key?impolicy=wcms_crop_resize&cropH=405&cropW=405&xPos=117&yPos=0&width=100&height=100',
  TINY_1X1_LIVE = 'https://live-production.wcms.abc-cdn.net.au/key?impolicy=wcms_crop_resize&cropH=405&cropW=405&xPos=117&yPos=0&width=5&height=5'
}

describe('getImageRendition', () => {
  describe('live - detected', () => {
    test('big 16x9', () => {
      expect(getImageRendition('key', { cropWidth: 640, cropHeight: 360, x: 0, y: 0 }, 862)).toBe(
        RESULTS.BIG_16X9_LIVE
      );
    });
    test('small 16x9', () => {
      expect(getImageRendition('key', { cropWidth: 640, cropHeight: 360, x: 0, y: 0 }, 100)).toBe(
        RESULTS.SMALL_16X9_LIVE
      );
    });
    test('big 1x1', () => {
      expect(getImageRendition('key', { cropWidth: 405, cropHeight: 405, x: 117, y: 0 }, 862)).toBe(
        RESULTS.BIG_1X1_LIVE
      );
    });
    test('tiny 1x1', () => {
      expect(getImageRendition('key', { cropWidth: 405, cropHeight: 405, x: 117, y: 0 }, 5)).toBe(
        RESULTS.TINY_1X1_LIVE
      );
    });
  });

  describe('live - forced', () => {
    test('big 16x9', () => {
      expect(getImageRendition('key', { cropWidth: 640, cropHeight: 360, x: 0, y: 0 }, 862, TIERS.LIVE)).toBe(
        RESULTS.BIG_16X9_LIVE
      );
    });
  });

  describe('preview - forced', () => {
    test('big 16x9', () => {
      expect(getImageRendition('key', { cropWidth: 640, cropHeight: 360, x: 0, y: 0 }, 862, TIERS.PREVIEW)).toBe(
        RESULTS.BIG_16X9_PREVIEW
      );
    });
  });
});

describe('getImageRenditions', () => {
  test('live - detected', () => {
    expect(
      getImageRenditions(
        'key',
        {
          '16x9': { cropWidth: 640, cropHeight: 360, x: 0, y: 0 },
          '1x1': { cropWidth: 405, cropHeight: 405, x: 117, y: 0 }
        },
        [862, 100]
      )
    ).toEqual([
      { ratio: '16x9', width: 862, url: RESULTS.BIG_16X9_LIVE },
      { ratio: '16x9', width: 100, url: RESULTS.SMALL_16X9_LIVE },
      { ratio: '1x1', width: 862, url: RESULTS.BIG_1X1_LIVE },
      { ratio: '1x1', width: 100, url: RESULTS.SMALL_1X1_LIVE }
    ]);
  });
});
