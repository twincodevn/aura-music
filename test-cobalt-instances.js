async function test() {
  const instances = [
    'https://cobalt.wukko.me/',
    'https://api.cobalt.best/',
    'https://co.wuk.sh/',
    'https://api.cobalt.tools/' // officially restricted
  ];
  const url = 'https://www.youtube.com/watch?v=6KO8sVvKejI';
  
  for (const inst of instances) {
     try {
         const res = await fetch(inst, {
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
         const text = await res.text();
         console.log(inst, res.status, text.substring(0, 100));
     } catch(e) { }
  }
}
test();
