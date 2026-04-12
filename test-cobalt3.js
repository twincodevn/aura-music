async function test() {
  const url = 'https://www.youtube.com/watch?v=6KO8sVvKejI';
  
  // Cobalt public instances format
  const res = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         url: url,
         isAudioOnly: true
      })
  });
  if(res.ok) {
     const data = await res.json();
     console.log('URL:', data.url);
  } else {
     const text = await res.text();
     console.log('Failed:', res.status, text);
  }
}
test();
