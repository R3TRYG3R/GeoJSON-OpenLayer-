import Papa from "papaparse";

interface CSVRow {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

export const parseCSV = async (file: File) => {
  console.log("📄 Загружаем CSV файл:", file.name);

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      delimiter: ",", // ✅ Принудительно указываем разделитель
      skipEmptyLines: true, // ✅ Игнорируем пустые строки
      encoding: "utf-8", // ✅ Указываем кодировку
      complete: (result) => {
        console.log("🔍 CSV Парсинг завершён. Результат:", result);

        if (result.errors.length) {
          console.error("❌ Ошибки при парсинге CSV:", result.errors);
          reject(result.errors);
          return;
        }

        const data = result.data as CSVRow[];
        console.log("✅ CSV успешно загружен:", data);

        if (!data[0]?.latitude || !data[0]?.longitude) {
          console.error("❌ Ошибка: В CSV нет колонок `latitude` и `longitude`!");
          reject(new Error("CSV должен содержать колонки `latitude` и `longitude`"));
          return;
        }

        const geojson = {
          type: "FeatureCollection",
          features: data.map((row) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [row.longitude, row.latitude],
            },
            properties: row,
          })),
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