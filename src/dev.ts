import { fetchArticle } from './';

const API_KEY = import.meta.env.VITE_TERMINUS_FETCH_API_KEY;

console.log('API_KEY :>> ', API_KEY);

fetchArticle(9716354, { apiKey: String(API_KEY) }).then(d => {
  console.log('d :>> ', d);
});
