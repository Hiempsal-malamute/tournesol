/*/////////////////////////////////////////////////
/                      PANEL                      /  
/////////////////////////////////////////////////*/

const panel = document.getElementById('panel');
const panelHeader = document.getElementById('panel-header');
const panelContent = document.getElementById('panel-content');

let startY = 0;
let currentHeight = 10;

// Handle touchstart event for dragging
panel.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
  currentHeight = parseInt(getComputedStyle(panel).height, 10) / window.innerHeight * 100;
});

// Handle touchmove event for dragging
panel.addEventListener('touchmove', (e) => {
  const deltaY = startY - e.touches[0].clientY;
  let newHeight = currentHeight + (deltaY / window.innerHeight) * 100;
  newHeight = Math.max(10, Math.min(90, newHeight));
  panel.style.height = `${newHeight}%`;
});

// Handle touchend event to snap to open/close state
panel.addEventListener('touchend', () => {
  openPanel()
});

function openPanel(finalHeight) {
  if (!finalHeight) {
    const finalHeight = parseInt(getComputedStyle(panel).height, 10) / window.innerHeight * 100;
    panel.style.height = finalHeight + '%'
    if(finalHeight < '40%') {
      panel.style.height = '20%';
      panelContent.style.display = 'none';
    }
  } else {
    panel.style.height = finalHeight + '%'
  }
  // if (finalHeight > 50) {
  //   panel.style.height = '90%';
  //   panelContent.style.display = 'block';
  // } else {
  //   panel.style.height = '20%';
  //   panelContent.style.display = 'none';
  // }
}

/*/////////////////////////////////////////////////
/                   MAP CONF                      /  
/////////////////////////////////////////////////*/


async function main() {
  async function fitGeoJsonBounds(map, url) {
      try {
        // Fetch the GeoJSON data
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
        
        const geoJson = await response.json();
    
        // Calculate the bounds of the GeoJSON
        const bounds = new maplibregl.LngLatBounds();
    
        geoJson.features.forEach(feature => {
          const coordinates = feature.geometry.coordinates;
          const type = feature.geometry.type;
          
          coordinates.forEach(coord => bounds.extend(coord));
        });
    
        // Fit the map to the bounds
        map.fitBounds(bounds, { padding: 100 });
      } catch (error) {
        console.error('Error fitting GeoJSON bounds:', error);
      }
  }

  let map = new maplibregl.Map({
      container: 'map', // container id
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // style URL
      // center: [15.66, 46.07], // starting position [lng, lat]
      // zoom: 4 // starting zoom
      attributionControl: false
  });
  // plus de fonds ici : https://medium.com/@go2garret/free-basemap-tiles-for-maplibre-18374fab60cb
  
  // add zoom controls
  map.addControl(new maplibregl.NavigationControl());
  
  // add scale
  let scale = new maplibregl.ScaleControl({
      maxWidth: 80,
      unit: 'imperial',
  });
  
  // map.addControl(scale, 'bottom-right');
  // scale.setUnit('metric');
  
  
  /*/////////////////////////////////////////////////
  /                    LAYERS                      /  
  /////////////////////////////////////////////////*/
  
  
  map.on('load', () => {           
      map.addSource('traces', {
          type:'geojson',
          data:'data/traces.geojson'
      });
  
      map.addLayer({
          id:'traces-layer',
          type:'line',
          source:'traces',
          'layout': {
              'line-join': 'round',
              'line-cap': 'round'
          },
          'paint': {
              'line-color': 'rgb(244,102,27)',
              'line-width': 5
          }
      })
  
  
  });

  fitGeoJsonBounds(map, 'data/traces.geojson');

  let data;
  fetch("data/cities.json")
  .then(res => res.json())
  .then(res => {
    data = res
    data.forEach(e => {

      listeVilles.innerHTML += `
        <div class="ville-option" id="${e['fid']}">
          <h4>${e['ville']}</h4>
          <span>${e['pays']}</span>
        </div>
      `
      const marker = new maplibregl.Marker()
      .setLngLat([e.long, e.lat])
      .addTo(map);
      
      marker.getElement().addEventListener('click', () => {
        urlSearchParams.set('id_ville', e.fid)
        window.history.pushState({}, '', url);
        // showFiche(e.fid, data)
      })
    })

    listeVilles.addEventListener("click", elem => {
      ville = elem.target
      if(ville && ville.className == "ville-option") {
        urlSearchParams.set('id_ville', ville.id)
        window.history.pushState({}, '', url);
        // showFiche(ville.id, data)
      }
    });
  })

  window.navigation.addEventListener('navigate', (e) => {
    id = urlSearchParams.get('id_ville')
    console.log(id)
    console.log(e.navigationType)
    
    if(e.navigationType == 'traverse') {
      hideFiche()
    }

    if(e.navigationType == 'push') {
      showFiche(id, data)
    }
  })
  
  backBtn.addEventListener('click', () => {
    hideFiche()
  })
  
  function showFiche(id, data) {
    urlSearchParams.set('id_ville', id)
    window.history.pushState({}, '', url);

    listeVilles.style.display = 'none'
    ficheVille.style.display = 'block'
    backBtn.style.display = 'block'
  
    filtered = data.find(e => e.fid == id)
    map.flyTo({center: [filtered.long, filtered.lat], zoom: 9});

    filtered['origins'].forEach(e => {
      ficheVille.innerHTML += `
      <div>
        <p>Depuis ${e['from']} :</p>
        <span><i>${e['commentaire']}</i></span>
        <h2>Et ton bilan carbone alors ? è_é</h2>
        <p><b>En avion : </b>${e['co2eq_avion']} :</p>
        <p><b>En train : </b>${e['co2eq_train']} :</p>
      </div>
      `
    })

    openPanel(70)
  } 
  
  function hideFiche() {
    listeVilles.style.display = 'block'
    ficheVille.style.display = 'none'
    backBtn.style.display = 'none'

    ficheVille.innerHTML = ''
    
    fitGeoJsonBounds(map, 'data/traces.geojson');

    openPanel(20)
  }
}

const listeVilles = document.getElementById('liste-ville')
const ficheVille = document.getElementById('fiche-ville')
const backBtn = document.getElementById('back')

const url = new URL(window.location.href);
const urlSearchParams = url.searchParams;

main()