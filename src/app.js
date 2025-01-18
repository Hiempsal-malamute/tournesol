const panel = document.getElementById('panel');
const panelHeader = document.getElementById('panel-header');

let startY = 0;
let currentHeight = 20; // Start height in percentage
let velocity = 0;
let animationFrame;

function isMobile() {
  return window.innerWidth < 768;
}

function adjustPanelLayout() {
  if (isMobile()) {
    panel.classList.add('mobile');
    panel.classList.remove('desktop');
    panel.style.height = `${currentHeight}%`;
    panel.style.width = '100%';
    panel.style.left = '0';
  } else {
    panel.classList.add('desktop');
    panel.classList.remove('mobile');
    panel.style.width = '500px';
    panel.style.height = '100%';
    panel.style.left = '0';
  }
}

panelHeader.addEventListener('touchstart', (e) => {
  if (!isMobile()) return;
  startY = e.touches[0].clientY;
  cancelAnimationFrame(animationFrame);
  velocity = 0;
});

panelHeader.addEventListener('touchmove', (e) => {
  if (!isMobile()) return;
  const deltaY = startY - e.touches[0].clientY;
  currentHeight = Math.min(90, Math.max(20, currentHeight + (deltaY / window.innerHeight) * 100));
  panel.style.height = `${currentHeight}%`;
  velocity = deltaY / (e.timeStamp || 1);
  startY = e.touches[0].clientY;
});

panelHeader.addEventListener('touchend', () => {
  if (!isMobile()) return;
  let snapTo;
  if (velocity > 0) {
    snapTo = Math.ceil(currentHeight / 10) * 10;
  } else {
    snapTo = Math.floor(currentHeight / 10) * 10;
    if (snapTo === 20) {
      snapTo = 25; // Add slight bounce back
      setTimeout(() => {
        panel.style.height = '20%'; // Reset to minimum after bounce
      }, 200);
    }
  }

  const animate = () => {
    currentHeight += (snapTo - currentHeight) * 0.2;
    panel.style.height = `${currentHeight}%`;
    if (Math.abs(snapTo - currentHeight) > 0.5) {
      animationFrame = requestAnimationFrame(animate);
    }
  };
  animate();
});


window.addEventListener('resize', adjustPanelLayout);
adjustPanelLayout();

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  center: [0, 0],
  zoom: 2,
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
        if(!isMobile()) {
          padding = 200
          map.fitBounds(bounds, { padding: {top: padding, bottom:padding, left: padding*4.5, right: padding} });
        } else {
          map.fitBounds(bounds, { padding: 75 });
        }
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
  fetch("data/cities2.json")
  .then(res => res.json())
  .then(res => {
    data = res
    data.forEach(e => {

      listeVilles.innerHTML += `
        <div class="ville-option" id="${e['fid']}">
          <span>${e['ville']}</span>
        </div>
      `

      // Function to create the custom marker element
      function createCustomMarker(imageUrl) {
        const markerElement = document.createElement('div');
        markerElement.style.backgroundImage = `url(${imageUrl})`;
        markerElement.style.backgroundSize = 'contain';
        markerElement.style.width = '40px'; // Adjust the size of the marker as needed
        markerElement.style.height = '40px';
        return markerElement;
      }

      const marker = new maplibregl.Marker({
        element: createCustomMarker('assets/picto-formes-tournesol_39.png')
      })
      .setLngLat([e.long, e.lat])
      .addTo(map);
      
      marker.getElement().addEventListener('click', () => {
        urlSearchParams.set('id_ville', e.fid)
        window.history.pushState({}, '', url);
        // showFiche(e.fid, data)
      })
    })
    let i = 0
    listeVilles.addEventListener("click", elem => {
      i++;
      ville = elem.target
      if(ville && ville.className == "ville-option") {
        urlSearchParams.set('id_ville', ville.id);
        window.history.pushState({}, '', url);
        // showFiche(ville.id, data)
      }
    });
  })

  

  if(window.navigation) {
    window.navigation.addEventListener('navigate', (e) => {
      id = urlSearchParams.get('id_ville')
      
      if(e.navigationType == 'traverse') {
        hideFiche()
      }
  
      if(e.navigationType == 'push') {
        showFiche(id, data)
      }
    })
  } else {
    let currentPage = location.href
    setInterval(() => {
      if (currentPage != location.href) {
        // page has changed, set new page as 'current'
        currentPage = new URL(location.href);
        id = currentPage.searchParams.get("id_ville")
        if(id) { showFiche(id, data) } else { hideFiche() }
      }
    }, 500);    
  }


  
  backBtn.addEventListener('click', () => {
    hideFiche()
  })
  
  async function showFiche(id, data) {
    ficheVille.innerHTML = '';
    listeVilles.style.display = 'none';
    ficheVille.style.display = 'block';
    backBtn.style.display = 'block';
    if(isMobile()) {
      intro.style.display = 'none';
    }

  
    filtered = data.find(e => e.fid == id)

    let paddingBottomMarker
    if( isMobile()) { paddingBottomMarker = -330 } else { paddingBottomMarker = 0}

    map.flyTo({
      center: [filtered.long, filtered.lat], 
      zoom: 9,
      offset: [0, paddingBottomMarker],
    });

    // ajout wikipedia image
    const villeImageUrl = async (ville) => {
      const imageUrl = await fetchWikiImage(ville)
      ficheVille.innerHTML += `<img src="${imageUrl}" style="width:100%"/>`;
    }
    // villeImageUrl(filtered['ville'])

    ficheVille.innerHTML += `
    <div class="card-header">
      <span class="ville-nom">${filtered['ville']}</span>
      <span>${filtered['pays']}</span>
      <hr>
    </div>
    `;
    
    filtered['origins'].forEach(e => {
      ficheVille.innerHTML += `
      <div style="font-size:1.25em">
        <p><i>Depuis ${e['from']}</i></p>
      </div>
      `
      // ajout itinéraires et détails
      e['options'].forEach(option => {
        ficheVille.innerHTML += `
        <div class="option-details">
          <p><img class="picto-velo" src="${getIconVelo(option['velo_transport'])}" title="${option['velo_transport']}"/>
          ${option['instructions']}</p>
          <p><span class="tag-option">Durée :</span> ${option['duration']}</p>
          <p><span class="tag-option">Transport de vélo : </span>${option['velo_transport']}</p>
          <p><span class="tag-option">Prix € :</span> ${option['price']}</p>
        </div>
        `
      })
      
      avion_fois_moins = Math.round(e['co2eq_avion'] / e['co2eq_train'])

      // ajout bilan carbone
      ficheVille.innerHTML += `
        <div class="bilan-carbone">
          <span class="title">
            Bilan carbone depuis ${e['from']}
          </span>
          <div class="mode">
            <i class="ph ph-train-simple">
            </i><span>${e['co2eq_train']} kg CO₂</span>
          </div>
          contre
          <div class="mode">
            <i class="ph ph-airplane-tilt"></i>
            <span>${e['co2eq_avion']} kg CO₂ (soit <b>${avion_fois_moins}</b> fois plus que le train)</span>
          </div>
        </div>
      </div>
      `
    })
      
    if (isMobile()) {
      panel.style.height = `${80}%`;
    }
  } 
  
  function hideFiche() {
    listeVilles.style.display = 'block';
    ficheVille.style.display = 'none';
    backBtn.style.display = 'none';
    if(isMobile()) {
      intro.style.display = 'block';
    }

    ficheVille.innerHTML = ''
    
    fitGeoJsonBounds(map, 'data/traces.geojson');

    if (isMobile()) {
      panel.style.height = `${20}%`;
    }
  }
}

const listeVilles = document.getElementById('liste-ville');
const ficheVille = document.getElementById('fiche-ville');
const backBtn = document.getElementById('back');
const intro = document.getElementById('intro');

const url = new URL(window.location.href);
const urlSearchParams = url.searchParams;

main();

const fetchWikiImage = async (pageTitle) => {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageimages&format=json&pithumbsize=500&origin=*`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0]; // Access the first page object
    console.log(page)
    const imageUrl = page.thumbnail?.source;

    if (imageUrl) {
      return imageUrl
    } else {
      console.error("No image found for this page.");
    }
  } catch (error) {
    console.error("Error fetching image:", error);
  }
};

function getIconVelo(e) {
  let path = 'assets/picto_velo/'
  switch (e) {
    case "interdit":
      return path+ 'interdit' + '.svg'
    case "autorisé":
      return path+ 'autorise' + '.svg'
    case "autorisé si démonté":
      return path+ 'autorise_si_demonte' + '.svg'
    case "manque d'information":
      return path+ 'manque_info' + '.svg'  
  }
  
}

// "interdit"
// "autorisé"
// "autorisé si démonté"
// "manque d'information (mais souvent ça passe démonté sous housse)