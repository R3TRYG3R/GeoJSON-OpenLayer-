import shp from "shpjs";

// Корректная декодировка Windows-1251 строк
const decodeWin1251 = (input: string): string => {
  try {
    const bytes = Uint8Array.from([...input].map((c) => c.charCodeAt(0)));
    const decoder = new TextDecoder("windows-1251");
    return decoder.decode(bytes);
  } catch (error) {
    console.warn("⚠️ Ошибка декодирования строки:", input, error);
    return input;
  }
};

export const parseShapefile = async (file: File) => {
  console.log("📄 Загружаем Shapefile:", file.name);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await shp(arrayBuffer);

    const collections = Array.isArray(result) ? result : [result];

    const allFeatures = collections.flatMap((collection, i) => {
      if (!collection || !collection.features?.length) return [];

      return collection.features.map((feature: any, index: number) => {
        const id = `${i + 1}_${index + 1}`;

        const decodedProps: Record<string, any> = {};
        for (const key in feature.properties) {
          const val = feature.properties[key];
          decodedProps[key] = typeof val === "string" ? decodeWin1251(val) : val;
        }

        return {
          ...feature,
          id,
          properties: {
            id,
            ...decodedProps,
          },
        };
      });
    });

    const geojson = {
      type: "FeatureCollection",
      features: allFeatures,
    };

    console.log("✅ Shapefile успешно обработан:", geojson);
    return geojson;
  } catch (error) {
    console.error("❌ Ошибка при парсинге Shapefile:", error);
    return null;
  }
};