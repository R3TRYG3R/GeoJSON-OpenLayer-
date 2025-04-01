import Papa from "papaparse";
import wellknown from "wellknown";

interface CSVRow {
  latitude?: number;
  longitude?: number;
  geom?: string;
  [key: string]: any;
}

export const parseCSV = async (file: File) => {
  console.log("📄 Загружаем CSV файл:", file.name);

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      delimiter: ",",
      skipEmptyLines: true,
      encoding: "utf-8",
      complete: (result) => {
        console.log("🔍 CSV Парсинг завершён. Результат:", result);

        if (result.errors.length) {
          console.error("❌ Ошибки при парсинге CSV:", result.errors);
          reject(result.errors);
          return;
        }

        const data = result.data as CSVRow[];

        if (!data.length) {
          reject(new Error("❌ CSV не содержит данных"));
          return;
        }

        let geojsonFeatures = [];

        if ("latitude" in data[0] && "longitude" in data[0]) {
          console.log("🧭 Используем координаты latitude/longitude");
          geojsonFeatures = data.map((row, index) => ({
            type: "Feature",
            id: index + 1, // 👈 Уникальный ID
            geometry: {
              type: "Point",
              coordinates: [row.longitude!, row.latitude!],
            },
            properties: {
              id: index + 1, // 👈 Для таблицы
              ...row,
            },
          }));
        } else if ("geom" in data[0]) {
          console.log("📐 Используем геометрию из WKT (поле geom)");
          geojsonFeatures = data
            .map((row, index) => {
              const geometry = wellknown.parse(row.geom ?? "");
              if (!geometry) {
                console.warn(`⚠️ Невозможно распарсить geom в строке ${index + 1}:`, row.geom);
                return null;
              }

              const properties = { ...row };
              delete properties.geom;

              return {
                type: "Feature",
                id: index + 1, // 👈 Уникальный ID
                geometry,
                properties: {
                  id: index + 1, // 👈 Для таблицы
                  ...properties,
                },
              };
            })
            .filter((f) => f && f.geometry); // Убираем записи без геометрии
        } else {
          reject(new Error("❌ CSV должен содержать `latitude/longitude` или `geom` (WKT)"));
          return;
        }

        const geojson = {
          type: "FeatureCollection",
          features: geojsonFeatures,
        };

        console.log("🌍 Преобразованный GeoJSON:", geojson);
        resolve(geojson);
      },
      error: (error) => {
        console.error("❌ Ошибка парсинга CSV:", error);
        reject(error);
      },
    });
  });
};