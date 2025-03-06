import { parseCSV } from "./parseCSV";
import { parseGeoJSON } from "./parseGeoJSON";
import { parseShapefile } from "./parseShapefile";

const getFileExtension = (filename: string) => filename.split(".").pop()?.toLowerCase();

export const parseFile = async (file: File) => {
  try {
    const ext = getFileExtension(file.name);

    switch (ext) {
      case "csv":
        return await parseCSV(file);
      case "geojson":
        return await parseGeoJSON(file);
      case "shp":
        return await parseShapefile(file);
      default:
        throw new Error("❌ Неподдерживаемый формат файла");
    }
  } catch (error) {
    console.error("❌ Ошибка при обработке файла:", error);
    return null; // Возвращаем null, чтобы избежать краша
  }
};