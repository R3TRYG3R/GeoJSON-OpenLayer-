import Papa from "papaparse";

export const parseCSV = (file: File) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        if (result.errors.length) {
          reject(result.errors);
        } else {
          const geojson = {
            type: "FeatureCollection",
            features: result.data.map((row: any) => ({
              type: "Feature",
              properties: row,
              geometry: null, // В CSV нет геометрии
            })),
          };
          resolve(geojson);
        }
      },
    });
  });
};