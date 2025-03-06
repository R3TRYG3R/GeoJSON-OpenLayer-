import shp from "shpjs";

export const parseShapefile = async (file: File) => {
  console.log("📄 Загружаем Shapefile:", file.name);

  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log("🔍 Файл прочитан как ArrayBuffer, передаём в shpjs...");

    const geojson = await shp(arrayBuffer);
    console.log("✅ Успешно загружен Shapefile → GeoJSON:", geojson);

    return geojson;
  } catch (error) {
    console.error("❌ Ошибка при парсинге Shapefile:", error);
    return null;
  }
};