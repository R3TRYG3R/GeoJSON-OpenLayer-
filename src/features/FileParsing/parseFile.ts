import { parseCSV } from "./parseCSV";
import { parseGeoJSON } from "./parseGeoJSON";
import { parseShapefile } from "./parseShapefile";

const getFileExtension = (filename: string) => filename.split(".").pop()?.toLowerCase();

export const parseFile = async (file: File) => {
  const ext = getFileExtension(file.name);
  console.log(`📂 Загружен файл: ${file.name}, формат: ${ext}`);

  switch (ext) {
    case "csv":
      console.log("➡️ Выбран CSV парсер");
      return parseCSV(file);
    case "geojson":
      console.log("➡️ Выбран GeoJSON парсер");
      return parseGeoJSON(file);
    case "zip": // ✅ Поддержка ZIP
      console.log("➡️ Выбран Shapefile парсер (ZIP)");
      return parseShapefile(file);
    default:
      console.error("❌ Ошибка: неподдерживаемый формат файла!");
      return Promise.reject(new Error("Неподдерживаемый формат файла"));
  }
};