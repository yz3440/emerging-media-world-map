const config = {
  style: "mapbox://styles/mapbox/light-v10",
  // style: "mapbox://styles/yfz/ckhinbzz13h2p19pbswlvtuje",
  accessToken:
    "pk.eyJ1IjoieWZ6IiwiYSI6ImNraDVyNTh1bTA5NW8ycnF6eGFiaWk5ZTAifQ.sFYDR1I1E99cxPrNX9mKyw",

  center: [Math.random() * 360 - 180, 27.98794],

  zoom: 2,
  minZoom: 2,
  maxZoom: 13,
  flyToZoom: 10,
  title: "Emerging Media Institutions \n World Map",
  airtableURL: "https://airtable.com/shr2pwOMlZS4YT8Sl",
  description: "",
  sideBarInfo: ["Name", "Type", "City", "Country_Code"],
  popupInfo: ["Popup Information"],
  filters: [
    // {
    //   type: "dropdown",
    //   title: "Type: ",
    //   columnHeader: "Type",
    //   listItems: ["Academic", "Space", "Event", "Other"],
    // },
    {
      type: "checkbox",
      title: "Type: ",
      columnHeader: "Type",
      listItems: ["Academic", "Space", "Event", "Other"],
    },
    // {
    //   type: "checkbox",
    //   title: "Title of filter: ",
    //   columnHeader: "Column Name",
    //   listItems: ["filter one", "filter two", "filter three"],
    // },
    // {
    //   type: "dropdown",
    //   title: "Country: ",
    //   columnHeader: "Country",
    //   listItems: [
    //     "filter one",
    //     "filter two",
    //     "filter three",
    //     "filter four",
    //     "filter five",
    //     "filter six",
    //     "filter seven",
    //   ],
    // },
  ],
  layerStyles: {
    location: {
      layout: {
        "text-field": ["to-string", ["get", "Name"]],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0,
          12.45,
          16,
          22,
          24,
        ],
        "text-line-height": 1.2,
        "text-max-width": 10,
        "icon-image": [
          "match",
          ["get", "Type"],
          ["Academic"],
          "college-15",
          ["Space"],
          "amusement-park-15",
          ["Event"],
          "art-gallery-15",
          ["Other"],
          "suitcase-11",
          "marker-editor",
        ],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          1,
          14.08,
          2,
          22,
          4,
        ],
        "text-anchor": "top",
        "text-offset": [0, 1],
        "text-padding": 2,
        "icon-padding": 2,
        "text-ignore-placement": true,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0, 4, 0, 5, 1],
        "text-halo-color": "hsla(0, 100%, 100%, 0.72)",
        "text-halo-width": 100,
        "text-halo-blur": 100,
      },
    },
    heatmap: {
      paint: {
        // Increase the heatmap weight based on frequency and property magnitude
        "heatmap-weight": 1,
        // Increase the heatmap color weight weight by zoom level
        // heatmap-intensity is a multiplier on top of heatmap-weight
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparancy color
        // to create a blur-like effect.
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0, 0, 255, 0)",
          0.1,
          "hsl(225, 50%, 57%)",
          0.3,
          "hsl(180, 50%, 50%)",
          0.5,
          "hsl(120, 50%, 50%)",
          0.7,
          "hsl(60, 50%, 50%)",
          1,
          "hsl(0, 50%, 50%)",
        ],
        // Adjust the heatmap radius by zoom level
        "heatmap-radius": 32,
        // Transition from heatmap to circle layer by zoom level
        "heatmap-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0.5,
          8.65,
          0.3,
          16,
          0,
        ],
      },
    },
  },
};
