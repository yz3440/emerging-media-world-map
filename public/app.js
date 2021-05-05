mapboxgl.accessToken = config.accessToken;
const columnHeaders = config.sideBarInfo;

let geojsonData = {};

let placeToBeAdded = {};

const filteredGeojson = {
  type: "FeatureCollection",
  features: [],
};

const title = document.getElementById("title");
title.innerText = config.title;

const dataSource = document.getElementById("data-source");
dataSource.innerHTML = `
<a href =${config.airtableURL} target="_blank" rel="noopener" class='title'>check original data table here</a>
`;
const map = new mapboxgl.Map({
  container: "map",
  style: config.style,
  center: config.center,
  zoom: config.zoom,
  maxZoom: config.maxZoom,
  minZoom: config.minZoom,
});

function flyToLocation(currentFeature, zoom) {
  if (map.getZoom() > zoom) zoom = Math.max(map.getZoom(), zoom);
  map.flyTo({
    center: currentFeature,
    zoom: zoom,
  });
}

function createPopup(currentFeature) {
  console.log(currentFeature);
  const popups = document.getElementsByClassName("mapboxgl-popup");
  /** Check if there is already a popup on the map and if so, remove it */
  if (popups[0]) popups[0].remove();

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
      ? " <p><b>Description: </b><br>" +
        currentFeature.properties.Description +
        "</p>"
      : ""
  }
  `;

  const popup = new mapboxgl.Popup({ closeOnClick: true, offset: [0, -15] })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML(description)
    .addTo(map);
}

function createAddingPopup(currentFeature) {
  const popups = document.getElementsByClassName("mapboxgl-popup");
  placeToBeAdded = currentFeature;

  /** Check if there is already a popup on the map and if so, remove it */
  if (popups[0]) popups[0].remove();

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
        ? currentFeature.context[currentFeature.context.length - 2].text + ", "
        : ""
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
        : ""
    }</textarea>
  </p>
  <input type="button" onClick="addingInstitution()" id="submit-adding" value = "Add to Map">
  `;

  const popup = new mapboxgl.Popup({ closeOnClick: true, offset: [0, -15] })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML(description)
    .addTo(map);
}

function addingInstitution() {
  let institutionData = {
    Name: $("#name-adding")[0].value,
    Website: $("#website-adding")[0].value,
    Description: $("#description-adding")[0].value,
    Type: $("#type-adding")[0].value,
    Country_Code: placeToBeAdded.context[
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
  console.log(institutionData);
  fetch("/api/institutions", {
    method: "POST",
    mode: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(institutionData),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Success:", data);
      const popups = document.getElementsByClassName("mapboxgl-popup");
      if (popups[0]) popups[0].remove();
      alert("Succesfully added, please refresh to see the change!");
    })
    .catch((err) => console.error(err));
}

function buildLocationList(locationData) {
  /* Add a new listing section to the sidebar. */
  const listings = document.getElementById("listings");
  listings.innerHTML = "";
  locationData.features.forEach(function (location, i) {
    const prop = location.properties;

    const listing = listings.appendChild(document.createElement("div"));
    /* Assign a unique `id` to the listing. */
    listing.id = "listing-" + prop.id;

    /* Assign the `item` class to each listing for styling. */
    listing.className = "item";

    /* Add the link to the individual listing created above. */
    const link = listing.appendChild(document.createElement("a"));
    link.className = "title";

    link.id = "link-" + prop.id;
    link.innerHTML =
      '<button class="flex-parent flex-parent--center-main">' +
      '<p style="line-height: 1.25">' +
      prop[columnHeaders[0]] +
      "</p>" +
      "</button>";

    /* Add details to the individual listing. */
    const details = listing.appendChild(document.createElement("div"));
    details.className = "content";

    const div = document.createElement("div");

    for (let i = 1; i < columnHeaders.length; i++) {
      let displayedColumnHeader =
        columnHeaders[i] === "Country_Code" ? "Country" : columnHeaders[i];

      div.innerHTML += `${displayedColumnHeader.toLowerCase()}/<b class="${
        prop[columnHeaders[i]].toLowerCase() + "-label"
      }">${prop[columnHeaders[i]]}</b>`;
      if (i != columnHeaders.length - 1) {
        div.innerHTML += " - ";
      }
    }
    details.appendChild(div);

    link.addEventListener("click", function () {
      const clickedListing = location.geometry.coordinates;
      flyToLocation(clickedListing, config.flyToZoom);
      createPopup(location);

      const activeItem = document.getElementsByClassName("active");
      if (activeItem[0]) {
        activeItem[0].classList.remove("active");
      }
      this.parentNode.classList.add("active");

      const divList = document.querySelectorAll(".content");
      const divCount = divList.length;
      for (i = 0; i < divCount; i++) {
        divList[i].style.maxHeight = null;
      }

      for (let i = 0; i < geojsonData.features.length; i++) {
        this.parentNode.classList.remove("active");
        this.classList.toggle("active");
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
        }
      }
    });
  });
}

// Build dropdown list function
// title - the name or 'category' of the selection e.g. 'Languages: '
// defaultValue - the default option for the dropdown list
// listItems - the array of filter items

function buildDropDownList(title, listItems) {
  const filtersDiv = document.getElementById("filters");
  const mainDiv = document.createElement("div");
  const filterTitle = document.createElement("h3");
  filterTitle.innerText = title;
  filterTitle.classList.add("py12", "txt-bold");
  mainDiv.appendChild(filterTitle);

  const selectContainer = document.createElement("div");
  selectContainer.classList.add("select-container", "center");

  const dropDown = document.createElement("select");
  dropDown.classList.add("select", "filter-option");

  const selectArrow = document.createElement("div");
  selectArrow.classList.add("select-arrow");

  const firstOption = document.createElement("option");

  dropDown.appendChild(firstOption);
  selectContainer.appendChild(dropDown);
  selectContainer.appendChild(selectArrow);
  mainDiv.appendChild(selectContainer);

  for (let i = 0; i < listItems.length; i++) {
    const opt = listItems[i];
    const el1 = document.createElement("option");
    el1.textContent = opt;
    el1.value = opt;
    dropDown.appendChild(el1);
  }
  filtersDiv.appendChild(mainDiv);
}

// Build checkbox function
// title - the name or 'category' of the selection e.g. 'Languages: '
// listItems - the array of filter items
// To DO: Clean up code - for every third checkbox, create a div and append new checkboxes to it

function buildCheckbox(title, listItems) {
  const filtersDiv = document.getElementById("filters");
  const mainDiv = document.createElement("div");
  const filterTitle = document.createElement("div");
  const formatcontainer = document.createElement("div");
  filterTitle.classList.add("center", "flex-parent", "py12", "txt-bold");
  formatcontainer.classList.add(
    "center",
    "flex-parent",
    "flex-parent--column",
    "px3",
    "flex-parent--space-between-main"
  );
  const secondLine = document.createElement("div");
  secondLine.classList.add(
    "center",
    "flex-parent",
    "py12",
    "px3",
    "flex-parent--space-between-main"
  );
  filterTitle.innerText = title;
  mainDiv.appendChild(filterTitle);
  mainDiv.appendChild(formatcontainer);

  for (let i = 0; i < listItems.length; i++) {
    const container = document.createElement("label");

    container.classList.add("checkbox-container");

    const input = document.createElement("input");
    input.classList.add("px12", "filter-option");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", listItems[i]);
    input.setAttribute("value", listItems[i]);

    const checkboxDiv = document.createElement("div");
    const inputValue = document.createElement("p");

    checkboxDiv.classList.add("checkbox", "mr6");
    checkboxDiv.appendChild(Assembly.createIcon("check"));

    container.appendChild(input);
    container.appendChild(checkboxDiv);
    container.appendChild(inputValue);

    formatcontainer.appendChild(container);
  }
  filtersDiv.appendChild(mainDiv);
}
function buildInlineCheckbox(title, listItems) {
  const filtersDiv = document.getElementById("inline-filters");
  const mainDiv = document.createElement("div");
  const filterTitle = document.createElement("div");
  const formatcontainer = document.createElement("div");
  filterTitle.classList.add("center", "flex-parent", "py12", "txt-bold");
  formatcontainer.classList.add(
    "center",
    "flex-parent",
    "flex-parent--row",
    "px3",
    "flex-parent--space-between-main"
  );
  const secondLine = document.createElement("div");
  secondLine.classList.add(
    "center",
    "flex-parent",
    "py12",
    "px3",
    "flex-parent--space-between-main"
  );
  filterTitle.innerText = title;
  // mainDiv.appendChild(filterTitle);
  mainDiv.appendChild(formatcontainer);

  for (let i = 0; i < listItems.length; i++) {
    const container = document.createElement("label");

    container.classList.add("checkbox-container");

    const input = document.createElement("input");
    input.classList.add("px12", "filter-option");

    input.setAttribute("type", "checkbox");
    input.setAttribute("id", listItems[i]);
    input.setAttribute("value", listItems[i]);
    input.setAttribute("checked", true);

    const checkboxDiv = document.createElement("div");
    const inputValue = document.createElement("p");
    inputValue.classList.add(`${listItems[i].toLowerCase()}-label`);
    inputValue.innerText = listItems[i];
    checkboxDiv.classList.add("checkbox", "mr6");
    checkboxDiv.appendChild(Assembly.createIcon("check"));

    container.appendChild(input);
    container.appendChild(checkboxDiv);
    container.appendChild(inputValue);

    formatcontainer.appendChild(container);
  }
  filtersDiv.appendChild(mainDiv);
}

const selectFilters = [];
const checkboxFilters = [];

function createFilterObject(filterSettings) {
  filterSettings.forEach(function (filter) {
    if (filter.type === "checkbox") {
      columnHeader = filter.columnHeader;
      listItems = filter.listItems;

      const keyValues = {};
      Object.assign(keyValues, { header: columnHeader, value: listItems });
      checkboxFilters.push(keyValues);
    }
    if (filter.type === "dropdown") {
      columnHeader = filter.columnHeader;
      listItems = filter.listItems;

      const keyValues = {};

      Object.assign(keyValues, { header: columnHeader, value: listItems });
      selectFilters.push(keyValues);
    }
  });
}

function applyFilters() {
  const filterForm = document.getElementById("filters");

  filterForm.addEventListener("change", function () {
    const filterOptionHTML = this.getElementsByClassName("filter-option");
    const filterOption = [].slice.call(filterOptionHTML);

    const geojSelectFilters = [];
    const geojCheckboxFilters = [];
    filteredFeatures = [];
    filteredGeojson.features = [];

    filterOption.forEach(function (filter) {
      if (filter.type === "checkbox" && filter.checked) {
        checkboxFilters.forEach(function (objs) {
          Object.entries(objs).forEach(function ([key, value]) {
            if (value.includes(filter.value)) {
              const geojFilter = [objs.header, filter.value];
              geojCheckboxFilters.push(geojFilter);
            }
          });
        });
      }
      if (filter.type === "select-one" && filter.value) {
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
        filteredGeojson.features.push(feature);
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

    map.getSource("locationData").setData(filteredGeojson);
    map.getSource("location-heat").setData(filteredGeojson);

    buildLocationList(filteredGeojson);
  });
}

function applyInlineFilters() {
  const filterForm = document.getElementById("inline-filters");

  filterForm.addEventListener("change", function () {
    const filterOptionHTML = this.getElementsByClassName("filter-option");
    const filterOption = [].slice.call(filterOptionHTML);

    const geojSelectFilters = [];
    const geojCheckboxFilters = [];
    filteredFeatures = [];
    filteredGeojson.features = [];

    filterOption.forEach(function (filter) {
      if (filter.type === "checkbox" && filter.checked) {
        checkboxFilters.forEach(function (objs) {
          Object.entries(objs).forEach(function ([key, value]) {
            if (value.includes(filter.value)) {
              const geojFilter = [objs.header, filter.value];
              geojCheckboxFilters.push(geojFilter);
            }
          });
        });
      }
      if (filter.type === "select-one" && filter.value) {
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

    map.getSource("locationData").setData(filteredGeojson);
    map.getSource("location-heat").setData(filteredGeojson);

    buildLocationList(filteredGeojson);
  });
}

function filters(filterSettings) {
  filterSettings.forEach(function (filter) {
    if (filter.type === "checkbox") {
      buildInlineCheckbox(filter.title, filter.listItems);
    } else if (filter.type === "dropdown") {
      buildDropDownList(filter.title, filter.listItems);
    }
  });
}

function removeFilters() {
  let input = document.getElementsByTagName("input");
  let select = document.getElementsByTagName("select");
  let selectOption = [].slice.call(select);
  let checkboxOption = [].slice.call(input);
  filteredGeojson.features = [];

  checkboxOption.forEach(function (checkbox) {
    if (checkbox.type == "checkbox" && checkbox.checked == true) {
      // checkbox.checked = false;
    }
  });

  selectOption.forEach(function (option) {
    option.selectedIndex = 0;
  });

  map.getSource("locationData").setData(geojsonData);
  buildLocationList(geojsonData);
}

// function removeFiltersButton() {
//   const removeFilter = document.getElementById("removeFilters");
//   removeFilter.addEventListener("click", function () {
//     removeFilters();
//   });
// }

createFilterObject(config.filters);
applyInlineFilters();

filters(config.filters);
// removeFiltersButton();

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: true, // Use the geocoder's default marker style
  zoom: 11,
  language: "en-US",
  placeholder: "search here to locate",
});

function sortByDistance(selectedPoint) {
  const options = { units: "miles" };
  if (filteredGeojson.features.length > 0) {
    var data = filteredGeojson;
  } else {
    var data = geojsonData;
  }
  data.features.forEach(function (data) {
    Object.defineProperty(data.properties, "distance", {
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
  const listings = document.getElementById("listings");
  while (listings.firstChild) {
    listings.removeChild(listings.firstChild);
  }
  buildLocationList(data);
}

geocoder.on("result", function (ev) {
  const searchResult = ev.result.geometry;
  removeFilters();
  sortByDistance(searchResult);
  console.log(ev.result);
  createAddingPopup(ev.result);
});

document
  .getElementById("search-box-container")
  .appendChild(geocoder.onAdd(map));

map.on("load", function () {
  // map.addControl(geocoder, "top-right");

  map.setLayoutProperty("country-label", "text-field", [
    "format",
    ["get", "name_en"],
    { "font-scale": 1.2 },
    "\n",
    {},
    ["get", "name"],
    {
      "font-scale": 0.8,
      "text-font": [
        "literal",
        ["DIN Offc Pro Italic", "Arial Unicode MS Regular"],
      ],
    },
  ]);

  console.log("loaded");
  $(document).ready(function () {
    console.log("ready");
    fetch("/api/institutions")
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
    map.addLayer({
      id: "locationData",
      type: "symbol",
      source: {
        type: "geojson",
        data: geojsonData,
      },
      layout: config.layerStyles.location.layout,
      paint: config.layerStyles.location.paint,
    });
    map.addLayer(
      {
        id: "location-heat",
        type: "heatmap",
        source: {
          type: "geojson",
          data: geojsonData,
        },
        // maxzoom: 9,
        paint: config.layerStyles.heatmap.paint,
      },
      "locationData"
    );

    map.on("click", "locationData", function (e) {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["locationData"],
      });
      const clickedPoint = features[0].geometry.coordinates;
      flyToLocation(clickedPoint, config.flyToZoom);
      sortByDistance(clickedPoint);
      createPopup(features[0]);
    });

    map.on("mouseenter", "locationData", function () {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "locationData", function () {
      map.getCanvas().style.cursor = "";
    });
    buildLocationList(geojsonData);
  }
});

// Modal - popup for filtering results
const filterResults = document.getElementById("filterResults");
const exitButton = document.getElementById("exitButton");
// const modal = document.getElementById("modal");

// filterResults.addEventListener("click", () => {
//   modal.classList.remove("hide-visually");
//   modal.classList.add("z5");
// });

// exitButton.addEventListener("click", () => {
//   modal.classList.add("hide-visually");
// });

// const description = document.getElementById("description");
// description.innerText = config.description;
