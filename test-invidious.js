async function test() {
  try {
      const res = await fetch('https://vid.puffyan.us/api/v1/videos/6KO8sVvKejI');
      if (res.ok) {
          const data = await res.json();
          const format = data.adaptiveFormats?.find(f => f.type?.includes('audio'));
          console.log('Stream URL:', format?.url?.substring(0, 50));
      } else {
          console.log('Failed:', res.status);
      }
  } catch(e) { console.log(e); }
}
test();
