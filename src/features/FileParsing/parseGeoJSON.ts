export const parseGeoJSON = async (file: File) => {
  try {
    console.log("📂 Загружаем GeoJSON файл:", file.name);

    const text = await file.text();
    if (!text) throw new Error("❌ Файл пуст или не может быть прочитан.");

    const json = JSON.parse(text);

    if (!json || json.type !== "FeatureCollection" || !json.features) {
      throw new Error("❌ Неверный формат GeoJSON. Ожидался `FeatureCollection`.");
    }

    // Проверяем и исправляем `properties`
    json.features = json.features.map((feature: any, index: number) => ({
      ...feature,
      properties: feature.properties && Object.keys(feature.properties).length > 0
        ? feature.properties // Если есть свойства, оставляем их
        : { id: index + 1, geometryType: feature.geometry.type }, // Если `properties` пуст, создаём
    }));

    console.log("✅ Успешно загружен GeoJSON:", json);
    return json;
  } catch (error) {
    console.error("❌ Ошибка при парсинге GeoJSON:", error);
    return null;
  }
};