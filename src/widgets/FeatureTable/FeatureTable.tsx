import React, { JSX } from "react";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";

interface FeatureTableProps {
  geojsonData: any;
}

export const FeatureTable: React.FC<FeatureTableProps> = ({ geojsonData }) => {
  const { selectedFeature } = useSelectedFeature();

  // ✅ Проверяем, есть ли данные
  if (!geojsonData || !geojsonData.features?.length) {
    return <p className="text-gray-500">Нет данных</p>;
  }

  return (
    <div className="overflow-x-auto mt-4 border rounded-lg">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Тип геометрии</th>
            <th className="border px-4 py-2">Свойства</th>
            <th className="border px-4 py-2">Координаты</th>
          </tr>
        </thead>
        <tbody>
          {geojsonData.features.map((feature: any, index: number) => {
            const geometry = feature.geometry;
            const properties = feature.properties;
            let coordinates: string | JSX.Element = "Нет данных";
            let geometryType = geometry?.type || "Не определено";

            // ✅ Определяем, является ли это GeoJSON
            const isGeoJSON = geojsonData.type === "FeatureCollection";

            if (geometry && isGeoJSON) {
              try {
                if (geometry.type === "Point") {
                  // ✅ Точка (широта и долгота совпадают)
                  const [lon, lat] = geometry.coordinates;
                  coordinates = `📍 ${lat}, ${lon}`;
                } else if (geometry.type === "LineString") {
                  coordinates = (
                    <ul>
                      {geometry.coordinates.map((coord: number[], i: number) => {
                        const [lon, lat] = coord;
                        return <li key={i}>{`📍 ${lat}, ${lon}`}</li>;
                      })}
                    </ul>
                  );
                } else if (geometry.type === "Polygon") {
                  coordinates = (
                    <ul>
                      {geometry.coordinates[0]?.map((coord: number[], i: number) => {
                        const [lon, lat] = coord;
                        return <li key={i}>{`📍 ${lat}, ${lon}`}</li>;
                      })}
                    </ul>
                  );
                }
              } catch (error) {
                console.error("Ошибка обработки координат:", error);
                coordinates = "⚠️ Ошибка";
              }
            }

            return (
              <tr key={index} className="cursor-pointer hover:bg-gray-100">
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{geometryType}</td>
                <td className="border px-4 py-2">
                  <ul>
                    {Object.entries(properties)
                      .filter(([key]) => key !== "geometryType")
                      .map(([key, value]) => (
                        <li key={key}>
                          <b>{key}:</b> {String(value)}
                        </li>
                      ))}
                  </ul>
                </td>
                <td className="border px-4 py-2">{coordinates}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};