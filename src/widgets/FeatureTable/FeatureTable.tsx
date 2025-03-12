import React, { JSX, useEffect, useState } from "react";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import "./FeatureTable.css";

interface FeatureTableProps {
  geojsonData: any;
}

export const FeatureTable: React.FC<FeatureTableProps> = ({ geojsonData }) => {
  const { selectedFeature } = useSelectedFeature();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  // Обновляем ID выделенного объекта при клике
  useEffect(() => {
    if (selectedFeature) {
      let featureId = selectedFeature.getId();

      // Нормализуем ID
      const normalizedId =
        featureId !== undefined
          ? typeof featureId === "string"
            ? parseInt(featureId.replace(/\D/g, ""), 10) || featureId
            : featureId
          : null; // Если featureId = undefined, ставим null

      console.log("🟢 Выбран объект с ID:", normalizedId);
      setSelectedId(normalizedId);
    } else {
      console.log("⚪ Нет выбранного объекта");
      setSelectedId(null);
    }
  }, [selectedFeature]);

  if (!geojsonData || !geojsonData.features?.length) {
    return <p className="no-data">Нет данных</p>;
  }

  return (
    <div className="table-container">
      <table className="feature-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Тип геометрии</th>
            <th>Свойства</th>
            <th>Координаты</th>
          </tr>
        </thead>
        <tbody>
          {geojsonData.features.map((feature: any, index: number) => {
            const geometry = feature.geometry;
            const properties = feature.properties;
            let coordinates: string | JSX.Element = "Нет данных";
            let geometryType = geometry?.type || "Не определено";

            if (geometry) {
              try {
                if (geometry.type === "Point") {
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
                console.error("❌ Ошибка обработки координат:", error);
                coordinates = "⚠️ Ошибка";
              }
            }

            // Определяем корректный ID объекта
            let featureId = feature.id ?? properties.id ?? index + 1;

            // Приводим ID к такому же формату, как в `selectedFeature`
            const normalizedFeatureId =
              featureId !== undefined
                ? typeof featureId === "string"
                  ? parseInt(featureId.replace(/\D/g, ""), 10) || featureId
                  : featureId
                : null; // 🛠 Если featureId = undefined, ставим null

            const isSelected = selectedId === normalizedFeatureId;

            console.log(
              `🔍 Объект ID: ${normalizedFeatureId} | Выбран? ${isSelected ? "✅ Да" : "❌ Нет"}`
            );

            return (
              <tr key={index} className={isSelected ? "selected" : ""}>
                <td>{normalizedFeatureId}</td>
                <td>{geometryType}</td>
                <td>
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
                <td>{coordinates}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};