import shp from "shpjs";

export const parseShapefile = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const geojson = await shp(arrayBuffer);
    return geojson;
  } catch (error) {
    throw new Error("Ошибка парсинга Shapefile");
  }
};