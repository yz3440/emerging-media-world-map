// Load necessary data from config
mapboxgl.accessToken = config.accessToken;

// Load different attribute names of a location
const columnHeaders = config.sideBarInfo;

// Load title
const title = document.getElementById('title');
title.innerText = config.title;

// Load from config the original Airtable URL and append it to the HTML
const dataSource = document.getElementById('data-source');
dataSource.innerHTML = `
<a href =${config.airtableURL} target="_blank" rel="noopener" class='title'>check original data table here</a>
`;

// To store all the location data for the map
let geojsonData = {};

// Placeholder variable for filtered results
const filteredGeojson = {
  type: 'FeatureCollection',
  features: [],
};

// Temporary Variable for place adding feature
let placeToBeAdded = {};

// Init Mapbox Map
const map = new mapboxgl.Map({
  container: 'map',
  style: config.style,
  center: config.center,
  zoom: config.zoom,
  maxZoom: config.maxZoom,
  minZoom: config.minZoom,
});

// Init Geocoder for the search and add function
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: true, // Use the geocoder's default marker style
  zoom: 11,
  language: 'en-US',
  placeholder: 'search here to locate',
});

function main() {
  // Init filter for location lists
  createFilterObject(config.filters);
  applyInlineFilters();
  filters(config.filters);

  map.on('load', function () {
    map.setLayoutProperty('country-label', 'text-field', [
      'format',
      ['get', 'name_en'],
      { 'font-scale': 1.2 },
      '\n',
      {},
      ['get', 'name'],
      {
        'font-scale': 0.8,
        'text-font': [
          'literal',
          ['DIN Offc Pro Italic', 'Arial Unicode MS Regular'],
        ],
      },
    ]);

    console.log('loaded');
    $(document).ready(function () {
      console.log('ready');
      fetch('/api/institutions')
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          console.log(data);
          initWithGeoJSON(data);
        })
        .catch((err) => {
          console.error(err);
        });
    });

    function initWithGeoJSON(geojson) {
      geojsonData = geojson;

      // filter out non-confirmed ones
      console.log('filtering out non-confirmed ones:');
      // print out non-confirmed ones
      const nonConfirmed = geojsonData.features
        .filter((d) => !d.properties.Confirmed)
        .map((d) => d.properties);
      console.log(nonConfirmed);

      // actual filtering
      geojsonData.features = geojsonData.features.filter(
        (d) => d.properties.Confirmed
      );

      map.addLayer({
        id: 'locationData',
        type: 'symbol',
        source: {
          type: 'geojson',
          data: geojsonData,
        },
        layout: config.layerStyles.location.layout,
        paint: config.layerStyles.location.paint,
      });
      map.addLayer(
        {
          id: 'location-heat',
          type: 'heatmap',
          source: {
            type: 'geojson',
            data: geojsonData,
          },
          // maxzoom: 9,
          paint: config.layerStyles.heatmap.paint,
        },
        'locationData'
      );

      map.on('click', 'locationData', function (e) {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['locationData'],
        });
        const clickedPoint = features[0].geometry.coordinates;
        flyToLocation(clickedPoint, config.flyToZoom);
        sortByDistance(clickedPoint);
        createPopup(features[0]);
      });

      map.on('mouseenter', 'locationData', function () {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'locationData', function () {
        map.getCanvas().style.cursor = '';
      });
      buildLocationList(geojsonData);
    }
  });

  // When user click on search results in the geocoder
  geocoder.on('result', function (ev) {
    const searchResult = ev.result.geometry;
    removeFilters();
    sortByDistance(searchResult);
    console.log(ev.result);
    createAddingPopup(ev.result);
  });

  document
    .getElementById('search-box-container')
    .appendChild(geocoder.onAdd(map));
}

// When user clicked on an entry for a location, fly to it
function flyToLocation(currentFeature, zoom) {
  if (map.getZoom() > zoom) zoom = Math.max(map.getZoom(), zoom);
  map.flyTo({
    center: currentFeature,
    zoom: zoom,
  });
}

//  Create popup tooltip for location's detail on the map
function createPopup(currentFeature) {
  console.log(currentFeature);
  const popups = document.getElementsByClassName('mapboxgl-popup');

  // Check if there is already a popup on the map and if so, remove it
  if (popups[0]) popups[0].remove();

  // HTML for the popup
  let description = `
  <a href="${currentFeature.properties.Website}" target="_blank" rel="noopener">
    <h3>
        <b>${currentFeature.properties.Name}</b>
    </h3>
  </a>
  <p>
    <b>Location: </b>${currentFeature.properties.City}, ${
    currentFeature.properties.Country
  }
  </p>
  <p>
    <b>Type: </b>${currentFeature.properties.Type}
  </p>
  ${
    currentFeature.properties.Description &&
    currentFeature.properties.Description.length !== 0
      ? ' <p><b>Description: </b><br>' +
        currentFeature.properties.Description +
        '</p>'
      : ''
  }
  `;

  // Create and add the popup to map
  const popup = new mapboxgl.Popup({ closeOnClick: true, offset: [0, -15] })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML(description)
    .addTo(map);
}

//  Create popup tooltip when user want to add a new location to the original data sheet
function createAddingPopup(currentFeature) {
  const popups = document.getElementsByClassName('mapboxgl-popup');
  placeToBeAdded = currentFeature;

  // Check if there is already a popup on the map and if so, remove it
  if (popups[0]) popups[0].remove();

  // HTML for the popup
  let description = `
    <h3>
        <b></b>
        <input type="text" id="name-adding" name="name" value = "${
          currentFeature.text
        }" placeholder = "Name of the Institution">
    </h3>
 
    <input type="text" id="website-adding" name="name" value = "" placeholder = "Website">
  <p>
    <b>Location: </b>${
      currentFeature.context[currentFeature.context.length - 2] != undefined
        ? currentFeature.context[currentFeature.context.length - 2].text + ', '
        : ''
    }${currentFeature.context[currentFeature.context.length - 1].text}
  </p>
  <p>
    <b>Type: </b>
    <select name="type" id="type-adding">
      <option value="Academic">Academic</option>
      <option value="Space">Space</option>
      <option value="Event">Event</option>
      <option value="Other">Other</option>
    </select>
  </p>
  <p>
    <b>Description: </b><br>
    <textarea id="description-adding" name="description" rows="3" placeholder = "Description of the Institution">${
      currentFeature.properties.category
        ? currentFeature.properties.category
        : ''
    }</textarea>
  </p>
  <input type="button" onClick="addingInstitution()" id="submit-adding" value = "Add to Map">
  `;

  // Create and add the popup to map
  const popup = new mapboxgl.Popup({ closeOnClick: true, offset: [0, -15] })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML(description)
    .addTo(map);
}

// When user confirmed adding, use the RESTFul API to POST the new location to the Airtable
function addingInstitution() {
  let institutionData = {
    Name: $('#name-adding')[0].value,
    Website: $('#website-adding')[0].value,
    Description: $('#description-adding')[0].value,
    Type: $('#type-adding')[0].value,
    Country_Code:
      placeToBeAdded.context[
        placeToBeAdded.context.length - 1
      ].short_code.toUpperCase(),
    Country: placeToBeAdded.context[placeToBeAdded.context.length - 1].text,
    City:
      placeToBeAdded.context.length >= 3
        ? placeToBeAdded.context[placeToBeAdded.context.length - 3].text
        : placeToBeAdded.context[placeToBeAdded.context.length - 2].text,
    Latitude: placeToBeAdded.center[1],
    Longitude: placeToBeAdded.center[0],
    Confirmed: false,
  };

  // the newly added institution will have a Comfirmed attribute set to false
  // waiting for the table admin to check on the Airtable website
  console.log(institutionData);
  fetch('/api/institutions', {
    method: 'POST',
    mode: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(institutionData),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log('Success:', data);
      const popups = document.getElementsByClassName('mapboxgl-popup');
      if (popups[0]) popups[0].remove();
      alert('Succesfully added, please refresh to see the change!');
    })
    .catch((err) => console.error(err));
}

// Render the location list on the side bar
function buildLocationList(locationData) {
  // Add a new listing section to the sidebar.
  const listings = document.getElementById('listings');
  listings.innerHTML = '';
  locationData.features.forEach(function (location, i) {
    const prop = location.properties;

    const listing = listings.appendChild(document.createElement('div'));
    /* Assign a unique `id` to the listing. */
    listing.id = 'listing-' + prop.id;

    /* Assign the `item` class to each listing for styling. */
    listing.className = 'item';

    /* Add the link to the individual listing created above. */
    const link = listing.appendChild(document.createElement('a'));
    link.className = 'title';

    link.id = 'link-' + prop.id;
    link.innerHTML =
      '<button class="flex-parent flex-parent--center-main">' +
      '<p style="line-height: 1.25">' +
      prop[columnHeaders[0]] +
      '</p>' +
      '</button>';

    // Add details to the individual listing
    const details = listing.appendChild(document.createElement('div'));
    details.className = 'content';

    const div = document.createElement('div');

    for (let i = 1; i < columnHeaders.length; i++) {
      let displayedColumnHeader =
        columnHeaders[i] === 'Country_Code' ? 'Country' : columnHeaders[i];

      div.innerHTML += `${displayedColumnHeader.toLowerCase()}/<b class="${
        prop[columnHeaders[i]].toLowerCase() + '-label'
      }">${prop[columnHeaders[i]]}</b>`;
      if (i != columnHeaders.length - 1) {
        div.innerHTML += ' - ';
      }
    }
    details.appendChild(div);

    link.addEventListener('click', function () {
      const clickedListing = location.geometry.coordinates;
      flyToLocation(clickedListing, config.flyToZoom);
      createPopup(location);

      const activeItem = document.getElementsByClassName('active');
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      this.parentNode.classList.add('active');

      const divList = document.querySelectorAll('.content');
      const divCount = divList.length;
      for (i = 0; i < divCount; i++) {
        divList[i].style.maxHeight = null;
      }

      for (let i = 0; i < geojsonData.features.length; i++) {
        this.parentNode.classList.remove('active');
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      }
    });
  });
}

// Sort the location list based on the current focused location
function sortByDistance(selectedPoint) {
  const options = { units: 'miles' };
  if (filteredGeojson.features.length > 0) {
    var data = filteredGeojson;
  } else {
    var data = geojsonData;
  }
  data.features.forEach(function (data) {
    Object.defineProperty(data.properties, 'distance', {
      value: turf.distance(selectedPoint, data.geometry, options),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  });

  data.features.sort(function (a, b) {
    if (a.properties.distance > b.properties.distance) {
      return 1;
    }
    if (a.properties.distance < b.properties.distance) {
      return -1;
    }
    return 0; // a must be equal to b
  });
  const listings = document.getElementById('listings');
  while (listings.firstChild) {
    listings.removeChild(listings.firstChild);
  }
  buildLocationList(data);
}

// The filter feature referenced https://labs.mapbox.com/impact-tools/finder/
// I did some rewiring to make it work but do not full understand how exactly it works
// My apologize for not being able to clean this up

// Build checkbox function
// title - the name or 'category' of the selection e.g. 'Languages: '
// listItems - the array of filter items

const selectFilters = [];
const checkboxFilters = [];

function buildInlineCheckbox(title, listItems) {
  const filtersDiv = document.getElementById('inline-filters');
  const mainDiv = document.createElement('div');
  const filterTitle = document.createElement('div');
  const formatcontainer = document.createElement('div');
  filterTitle.classList.add('center', 'flex-parent', 'py12', 'txt-bold');
  formatcontainer.classList.add(
    'center',
    'flex-parent',
    'flex-parent--row',
    'px3',
    'flex-parent--space-between-main'
  );
  const secondLine = document.createElement('div');
  secondLine.classList.add(
    'center',
    'flex-parent',
    'py12',
    'px3',
    'flex-parent--space-between-main'
  );
  filterTitle.innerText = title;
  // mainDiv.appendChild(filterTitle);
  mainDiv.appendChild(formatcontainer);

  for (let i = 0; i < listItems.length; i++) {
    const container = document.createElement('label');

    container.classList.add('checkbox-container');

    const input = document.createElement('input');
    input.classList.add('px12', 'filter-option');

    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', listItems[i]);
    input.setAttribute('value', listItems[i]);
    input.setAttribute('checked', true);

    const checkboxDiv = document.createElement('div');
    const inputValue = document.createElement('p');
    inputValue.classList.add(`${listItems[i].toLowerCase()}-label`);
    inputValue.innerText = listItems[i];
    checkboxDiv.classList.add('checkbox', 'mr6');
    checkboxDiv.appendChild(Assembly.createIcon('check'));

    container.appendChild(input);
    container.appendChild(checkboxDiv);
    container.appendChild(inputValue);

    formatcontainer.appendChild(container);
  }
  filtersDiv.appendChild(mainDiv);
}

function createFilterObject(filterSettings) {
  filterSettings.forEach(function (filter) {
    columnHeader = filter.columnHeader;
    listItems = filter.listItems;

    const keyValues = {};
    Object.assign(keyValues, { header: columnHeader, value: listItems });
    checkboxFilters.push(keyValues);
  });
}

function applyInlineFilters() {
  const filterForm = document.getElementById('inline-filters');

  filterForm.addEventListener('change', function () {
    const filterOptionHTML = this.getElementsByClassName('filter-option');
    const filterOption = [].slice.call(filterOptionHTML);

    const geojSelectFilters = [];
    const geojCheckboxFilters = [];
    filteredFeatures = [];
    filteredGeojson.features = [];

    filterOption.forEach(function (filter) {
      if (filter.type === 'checkbox' && filter.checked) {
        checkboxFilters.forEach(function (objs) {
          Object.entries(objs).forEach(function ([key, value]) {
            if (value.includes(filter.value)) {
              const geojFilter = [objs.header, filter.value];
              geojCheckboxFilters.push(geojFilter);
            }
          });
        });
      }
      if (filter.type === 'select-one' && filter.value) {
        selectFilters.forEach(function (objs) {
          Object.entries(objs).forEach(function ([key, value]) {
            if (value.includes(filter.value)) {
              const geojFilter = [objs.header, filter.value];
              geojSelectFilters.push(geojFilter);
            }
          });
        });
      }
    });

    if (geojCheckboxFilters.length === 0 && geojSelectFilters.length === 0) {
      geojsonData.features.forEach(function (feature) {
        // filteredGeojson.features.push(feature);
      });
    } else if (geojCheckboxFilters.length > 0) {
      geojCheckboxFilters.forEach(function (filter) {
        geojsonData.features.forEach(function (feature) {
          if (feature.properties[filter[0]].includes(filter[1])) {
            if (
              filteredGeojson.features.filter(
                (f) => f.properties.id === feature.properties.id
              ).length === 0
            ) {
              filteredGeojson.features.push(feature);
            }
          }
        });
      });
      if (geojSelectFilters.length > 0) {
        const removeIds = [];
        filteredGeojson.features.forEach(function (feature) {
          let selected = true;
          geojSelectFilters.forEach(function (filter) {
            if (
              feature.properties[filter[0]].indexOf(filter[1]) < 0 &&
              selected === true
            ) {
              selected = false;
              removeIds.push(feature.properties.id);
            } else if (selected === false) {
              removeIds.push(feature.properties.id);
            }
          });
        });
        removeIds.forEach(function (id) {
          const idx = filteredGeojson.features.findIndex(
            (f) => f.properties.id === id
          );
          filteredGeojson.features.splice(idx, 1);
        });
      }
    } else {
      geojsonData.features.forEach(function (feature) {
        let selected = true;
        geojSelectFilters.forEach(function (filter) {
          if (
            !feature.properties[filter[0]].includes(filter[1]) &&
            selected === true
          ) {
            selected = false;
          }
        });
        if (
          selected === true &&
          filteredGeojson.features.filter(
            (f) => f.properties.id === feature.properties.id
          ).length === 0
        ) {
          filteredGeojson.features.push(feature);
        }
      });
    }

    map.getSource('locationData').setData(filteredGeojson);
    map.getSource('location-heat').setData(filteredGeojson);

    buildLocationList(filteredGeojson);
  });
}

function filters(filterSettings) {
  filterSettings.forEach((filter) =>
    buildInlineCheckbox(filter.title, filter.listItems)
  );
}

function removeFilters() {
  let input = document.getElementsByTagName('input');
  let select = document.getElementsByTagName('select');
  let selectOption = [].slice.call(select);
  let checkboxOption = [].slice.call(input);
  filteredGeojson.features = [];

  checkboxOption.forEach(function (checkbox) {
    if (checkbox.type == 'checkbox' && checkbox.checked == true) {
      // checkbox.checked = false;
    }
  });

  selectOption.forEach(function (option) {
    option.selectedIndex = 0;
  });

  map.getSource('locationData').setData(geojsonData);
  buildLocationList(geojsonData);
}

main();
