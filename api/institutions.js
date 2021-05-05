import Airtable from "airtable";
import Status from "http-status-codes";

const apiKey = process.env.AIRTABLE_API_KEY;
const baseURL = process.env.AIRTABLE_BASE_URL;

const getAirtableTable = (tableName) => {
  const base = new Airtable({ apiKey: apiKey }).base(baseURL);
  const table = base(tableName);
  return table;
};

const getGeoJSONFromRecords = (records) => {
  let recordFeatures = records.map((record, i) => {
    let recordFields = record.fields;
    let recordFeature = {
      type: "Feature",
      geometry: {
        coordinates: [recordFields.Longitude, recordFields.Latitude],
        type: "Point",
      },
      properties: { ...recordFields, id: i },
    };
    return recordFeature;
  });

  let geojson = {
    type: "FeatureCollection",
    features: recordFeatures,
  };
  return geojson;
};

export default async (req, res) => {
  switch (req.method) {
    case "GET":
      try {
        const table = getAirtableTable("Institutions");
        const records = await table.select().all();
        const geojson = getGeoJSONFromRecords(records);
        res.status(Status.OK).json(geojson);
      } catch (err) {
        res.status(err.statusCode).send(err);
      }
      break;
    case "POST":
      try {
        const table = getAirtableTable("Institutions");
        const newRecord = { fields: req.body };
        table.create([newRecord], (err, records) => {
          if (err) {
            res.status(err.statusCode).send(err);
          } else {
            res.status(Status.OK).json(records);
          }
        });
      } catch (err) {
        res.status(err.statusCode).send(err);
      }
      break;
    default:
      res.status(Status.METHOD_NOT_ALLOWED).send();
      break;
  }
};
