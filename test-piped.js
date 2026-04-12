async function test() {
  const res = await fetch('https://pipedapi.kavin.rocks/streams/6KO8sVvKejI');
  const data = await res.json();
  console.log('AudioStreams count:', data.audioStreams?.length);
  const stream = data.audioStreams?.find(s => s.mimeType?.includes('audio/mp4') || s.mimeType?.includes('mp4a'));
  console.log('Stream URL:', stream?.url?.substring(0, 50));
}
test();
