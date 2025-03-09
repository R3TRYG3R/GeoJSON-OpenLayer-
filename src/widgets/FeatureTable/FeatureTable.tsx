import React, { useEffect, useState } from "react";

interface FeatureTableProps {
  geojsonData: any;
}

export const FeatureTable: React.FC<FeatureTableProps> = ({ geojsonData }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    console.log("🟢 Debug: Загруженные данные для таблицы:", geojsonData);
  }, [geojsonData]);

  if (!geojsonData || !geojsonData.features?.length) {
    return <p className="text-gray-500">No info</p>;
  }

  const features = geojsonData.features;

  // Собираем ВСЕ ключи из properties + id + geometryType (но без latitude/longitude)
  const allKeys = new Set<string>(["id", "geometryType"]);

  features.forEach((feature: any) => {
    if (feature.properties) {
      Object.keys(feature.properties).forEach((key) => {
        if (!["latitude", "longitude"].includes(key)) {
          allKeys.add(key);
        }
      });
    }
  });

  const headers = Array.from(allKeys);

  return (
    <div className="overflow-x-auto mt-4 border rounded-lg">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header) => (
              <th key={header} className="border border-gray-300 px-4 py-2 text-left">
                {header}
              </th>
            ))}
            <th className="border border-gray-300 px-4 py-2 text-left">Coordinates</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature: any, index: number) => {
            const coordinates = feature.geometry?.coordinates ?? [];
            const geometryType = feature.geometry?.type ?? "-";

            return (
              <tr key={index} className="border-t border-gray-300">
                {headers.map((header) => {
                  let value = feature.properties?.[header] ?? "-";
                  if (header === "id") value = index + 1;
                  if (header === "geometryType") value = geometryType;
                  return (
                    <td key={header} className="border border-gray-300 px-4 py-2">
                      {value}
                    </td>
                  );
                })}

                {/* ОДНА КНОПКА "ПОКАЗАТЬ" ДЛЯ ВСЕХ ФАЙЛОВ */}
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    className="text-blue-500 underline"
                    onClick={() => setExpanded(expanded === index ? null : index)}
                  >
                    {expanded === index ? "Скрыть" : "Показать"}
                  </button>
                  {expanded === index && (
                    <ul className="mt-2 text-sm">
                      {Array.isArray(coordinates[0])
                        ? coordinates.map((coord: number[], i: number) => (
                            <li key={i} className="text-gray-700">
                              {`📍 ${coord[1]}, ${coord[0]}`}
                            </li>
                          ))
                        : `📍 ${coordinates[1]}, ${coordinates[0]}`}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};