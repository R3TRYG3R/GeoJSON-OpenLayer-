import React, { useEffect, useState, useRef } from "react";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import "./FeatureTable.css";

interface FeatureTableProps {
  geojsonData: any;
}

export const FeatureTable: React.FC<FeatureTableProps> = ({ geojsonData }) => {
  const { selectedFeature } = useSelectedFeature();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isGeoJSON, setIsGeoJSON] = useState<boolean>(false);
  const rowRefs = useRef<Map<string | number, HTMLTableRowElement | null>>(new Map());

  // Обновляем ID выделенного объекта при клике
  useEffect(() => {
    if (selectedFeature) {
      let featureId = selectedFeature.getId();
      const normalizedId =
        featureId !== undefined
          ? typeof featureId === "string"
            ? parseInt(featureId.replace(/\D/g, ""), 10) || featureId
            : featureId
          : null;
      console.log("🟢 Выбран объект с ID:", normalizedId);
      setSelectedId(normalizedId);

      // Авто-скролл к выделенному объекту
      if (normalizedId !== null && rowRefs.current.has(normalizedId)) {
        rowRefs.current.get(normalizedId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } else {
      console.log("⚪ Нет выбранного объекта");
      setSelectedId(null);
    }
  }, [selectedFeature]);

  // Формируем динамические колонки
  useEffect(() => {
    if (!geojsonData || !geojsonData.features?.length) {
      setColumns([]);
      setIsGeoJSON(false);
      return;
    }

    let dynamicColumns: string[] = [];
    const firstFeature = geojsonData.features[0];

    // Определяем, является ли файл GeoJSON
    const isGeoJSONFormat =
      firstFeature.geometry && firstFeature.geometry.coordinates;

    setIsGeoJSON(!!isGeoJSONFormat);

    // Берем только названия колонок из properties (для CSV и Shapefile)
    if (firstFeature.properties && Object.keys(firstFeature.properties).length > 0) {
      dynamicColumns = Object.keys(firstFeature.properties);
    }

    // ✅ Добавляем id, если его нет в properties
    if (!dynamicColumns.includes("id")) {
      dynamicColumns.unshift("id");
    }

    if (isGeoJSONFormat) {
      dynamicColumns.push("coordinates");
    }

    setColumns(dynamicColumns);
  }, [geojsonData]);

  if (!geojsonData || !geojsonData.features?.length) {
    return <p className="no-data">Нет данных</p>;
  }

  return (
    <div className="table-container">
      <table className="feature-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {geojsonData.features.map((feature: any, index: number) => {
            const isSelected = selectedId === feature.properties?.id;
            const featureId = feature.properties?.id ?? index + 1;

            return (
              <tr
                key={index}
                ref={(el) => {
                  if (el) {
                    rowRefs.current.set(featureId, el);
                  }
                }}
                className={isSelected ? "selected" : ""}
              >
                {columns.map((col) => (
                  <td key={col}>
                    {col === "id"
                      ? featureId
                      : col === "coordinates" && isGeoJSON
                      ? JSON.stringify(feature.geometry.coordinates)
                      : feature.properties?.[col] ?? ""}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};