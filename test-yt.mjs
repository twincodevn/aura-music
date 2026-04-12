import YouTube from 'youtube-sr';
console.log('YouTube object:', typeof YouTube, Object.keys(YouTube || {}));
try {
  const res = await YouTube.search('music', {limit: 1});
  console.log('Search success:', res.length);
} catch (e) {
  console.error('Search failed:', e);
}
try {
  const res2 = await YouTube.default.search('music', {limit: 1});
  console.log('Default Search success:', res2.length);
} catch (e) {
  console.error('Default Search failed:', e);
}
