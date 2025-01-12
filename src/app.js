/*/////////////////////////////////////////////////
/                      PANEL                      /  
/////////////////////////////////////////////////*/


const bottomPanel = document.getElementById('bottom-panel');
const dragHandle = document.getElementById('drag-handle');

let startY;
let isDragging = false;
const panelMinHeight = 300; // Default panel height
const panelMaxHeight = window.innerHeight * 0.8; // 80% of screen height

// Check if it's a mobile device
function isMobileView() {
  return window.innerWidth < 768;
}

// Adjust panel snapping and ensure it stays within bounds
function adjustMobilePanel() {
  const currentTransform = parseInt(
    window.getComputedStyle(bottomPanel).transform.split(',')[5] || 0
  );

  // If the panel is dragged more than halfway up, snap to max height (80%)
  if (currentTransform < -panelMaxHeight / 2) {
    bottomPanel.style.transform = `translateY(-${panelMaxHeight - panelMinHeight}px)`;
    bottomPanel.style.height = `${panelMaxHeight}px`;
  } else {
    // Snap back to the default closed height
    bottomPanel.style.transform = 'translateY(0)';
    bottomPanel.style.height = `${panelMinHeight}px`;
  }
}

// Dragging logic for mobile
if (isMobileView()) {
  dragHandle.addEventListener('mousedown', (e) => {
    startY = e.clientY;
    isDragging = true;
    document.body.style.userSelect = 'none';
  });

  dragHandle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const newTransform = Math.min(0, Math.max(-panelMaxHeight + panelMinHeight, deltaY));
    bottomPanel.style.transform = `translateY(${newTransform}px)`;
  });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    const newTransform = Math.min(0, Math.max(-panelMaxHeight + panelMinHeight, deltaY));
    bottomPanel.style.transform = `translateY(${newTransform}px)`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = '';
    adjustMobilePanel();
  });

  document.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    adjustMobilePanel();
  });
}

// Disable dragging and reset panel height for desktop
window.addEventListener('resize', () => {
  if (!isMobileView()) {
    bottomPanel.style.transform = 'translateY(0)';
    bottomPanel.style.height = '100%';
    isDragging = false;
  } else {
    // Recalculate max height for mobile
    bottomPanel.style.height = `${panelMinHeight}px`;
  }
});


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
  });
  // plus de fonds ici : https://medium.com/@go2garret/free-basemap-tiles-for-maplibre-18374fab60cb
  
  // add zoom controls
  map.addControl(new maplibregl.NavigationControl());
  
  // add scale
  let scale = new maplibregl.ScaleControl({
      maxWidth: 80,
      unit: 'imperial',
  });
  
  map.addControl(scale, 'bottom-right');
  scale.setUnit('metric');
  
  
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
  
  // map.on('load', () => {
  //     map.addSource('cities', {
  //         type:'geojson',
  //         data:'data/cities.geojson'
  //     });
  
  //     map.addLayer({
  //         id:'cities-layer',
  //         type:'circle',
  //         source:'cities',
  //         // 'layout': {
  //         //     'line-join': 'round',
  //         //     'line-cap': 'round'
  //         // },
  //         // 'paint': {
  //         //     'line-color': 'rgb(244,102,27)',
  //         //     'line-width': 5
  //         // }
  //     });
  
  // })

  fitGeoJsonBounds(map, 'data/traces.geojson');

  fetch("data/cities.json")
  .then(res => res.json())
  .then(data => {

    data.forEach(e => {

      listeVilles.innerHTML += `
        <div class="ville-option" id="${e['fid']}">
          <h4 class="ville-option">${e['ville']}</h4>
          <span>${e['pays']}</span>
        </div>
      `
      const marker = new maplibregl.Marker()
      .setLngLat([e.long, e.lat])
      .addTo(map);
      
      marker.getElement().addEventListener('click', () => {
        showFiche(e.fid, data)
      })
    })

    listeVilles.addEventListener("click", elem => {
      ville = elem.target
      if(elem.target && elem.target.className == "ville-option") {
        showFiche(ville.id, data)
      }
    });
  })

  backBtn.addEventListener('click', () => {
    hideFiche()
  })
  
  function showFiche(id, data) {
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
  }
  
  function hideFiche() {
    listeVilles.style.display = 'block'
    ficheVille.style.display = 'none'
    backBtn.style.display = 'none'

    ficheVille.innerHTML = ''
  
    fitGeoJsonBounds(map, 'data/traces.geojson');
  }
}

const listeVilles = document.getElementById('liste-ville')
const ficheVille = document.getElementById('fiche-ville')
const backBtn = document.getElementById('back')

main()
