import { TIERS, getTier } from '@abcnews/env-utils';
import { getImages } from './lib/images';

// interface TerminusDocument {
//   _links?: Record<string, unknown>;
//   _embedded?: {
//     [key: string]: TerminusDocument[];
//   };
// }

type Options = {
  apiKey: string;
  force?: TIERS;
};

// This built JS asset _will_be_ rewritten on-the-fly, so we need to obscure the origin somewhat
// const GENIUNE_MEDIA_ENDPOINT_PATTERN = new RegExp(['http', '://', 'mpegmedia', '.abc.net.au'].join(''), 'g');
// const PROXIED_MEDIA_ENDPOINT = 'https://abcmedia.akamaized.net';
const TERMINUS_LIVE_ENDPOINT = 'https://api.abc.net.au/terminus';
const TERMINUS_PREVIEW_ENDPOINT = 'https://api-preview.terminus.abc-prod.net.au';

// the base url is the domain and path including the version
function getBaseUrl(force?: TIERS): string {
  const url = new URL(window.location.toString());
  const base = url.searchParams.get('terminusBaseURL');
  if (!base) return `${getEndpoint(force)}/`;
  return new URL(base.replace('.private', '')).origin + '/';
}

// const query = `#graphql
//   query($filter: CoremediaSearchInput) {
//     CoremediaSearch(
//     filter: $filter
//     sortField: LASTPUBLISHEDDATE
//     sortOrder: DESC
//     limit: 500
//   ) {
//     pagination {
//       total
//       size
//       offset
//     }
//     documents {
//       id
//       uri
//     }
//   }
//   }
// `;

// The endpoint is the domain and path to the API, excluding the version
function getEndpoint(force?: TIERS): string {
  return (getTier() === TIERS.PREVIEW || force === TIERS.PREVIEW) && force !== TIERS.LIVE
    ? TERMINUS_PREVIEW_ENDPOINT
    : TERMINUS_LIVE_ENDPOINT;
}

function fetchArticle(id: string | number, options: Options) {
  const query = `#graphql
    query ($id: ID!) {
      CoremediaArticle(id: $id) {
        id
        contentType
        canonicalURI
        embeddedMedia {
          id
          contentType
          ... on CoremediaImage {
            defaultRatio
          }
        }
      }
    }`;

  return request({ query, variables: { id } }, options);
}

// function search(searchOptions?: SearchOptions): Promise<TerminusDocument[]> {
//   return new Promise<TerminusDocument[]>((resolve, reject) => {
//     const { force, source, version, ...searchParams } = {
//       ...DEFAULT_SEARCH_OPTIONS,
//       ...(searchOptions || ({} as SearchOptions))
//     };
//     const searchParamsKeys = Object.keys(searchParams);

//     request(
//       `${getBaseUrl({ force })}/search/${source}?${searchParamsKeys
//         .map(key => `${key}=${searchParams[key]}`)
//         .join('&')}${searchParamsKeys.length ? '&' : ''}apikey=${API_KEY}`,
//       (response: TerminusDocument) => resolve(flattenEmbeddedProps(response._embedded || {})),
//       reject
//     );
//   });
// }

function request(
  { query, variables }: { query: string; variables: Record<string, string | number> },
  { apiKey, force }: Options
) {
  return fetch(`${getBaseUrl(force)}graphql/query`, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
    headers: {
      'x-api-key': apiKey
    }
  });
}

// function parse(responseText: string): TerminusDocument {
//   // Terminus is not returning proxied asset URLs (yet)
//   return JSON.parse(responseText.replace(GENIUNE_MEDIA_ENDPOINT_PATTERN, PROXIED_MEDIA_ENDPOINT));
// }

export { fetchArticle, getImages };
