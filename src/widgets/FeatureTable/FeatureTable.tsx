import React, { useEffect, useState, useRef } from "react";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useMap } from "../../context/MapContext";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import "./FeatureTable.css";

interface FeatureTableProps {
  geojsonData: any;
}

export const FeatureTable: React.FC<FeatureTableProps> = ({ geojsonData }) => {
  const { selectedFeature, setSelectedFeature } = useSelectedFeature();
  const { zoomToFeature } = useMap();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isGeoJSON, setIsGeoJSON] = useState<boolean>(false);
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());

  useEffect(() => {
    if (selectedFeature) {
      const featureId = selectedFeature.getId();
      const normalizedId = featureId != null ? String(featureId) : null;

      setSelectedId(normalizedId);

      if (normalizedId && rowRefs.current.has(normalizedId)) {
        rowRefs.current.get(normalizedId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      zoomToFeature(selectedFeature);
    } else {
      setSelectedId(null);
    }
  }, [selectedFeature]);

  useEffect(() => {
    if (!geojsonData || !geojsonData.features?.length) {
      setColumns([]);
      setIsGeoJSON(false);
      return;
    }

    let dynamicColumns: string[] = [];
    const firstFeature = geojsonData.features[0];

    const isGeoJSONFormat =
      firstFeature.geometry && firstFeature.geometry.coordinates;

    setIsGeoJSON(!!isGeoJSONFormat);

    if (firstFeature.properties && Object.keys(firstFeature.properties).length > 0) {
      dynamicColumns = Object.keys(firstFeature.properties);
    }

    if (!dynamicColumns.includes("id")) {
      dynamicColumns.unshift("id");
    }

    if (isGeoJSONFormat) {
      dynamicColumns.push("coordinates");
    }

    setColumns(dynamicColumns);
  }, [geojsonData]);

  const measureTextWidth = (text: string, font = "14px Arial") => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return 0;
    context.font = font;
    return context.measureText(text).width + 16;
  };

  useEffect(() => {
    if (!geojsonData || !geojsonData.features?.length) return;

    const newWidths: { [key: string]: number } = {};

    columns.forEach((col) => {
      let maxWidth = measureTextWidth(col);

      geojsonData.features.forEach((feature: any) => {
        const value =
          col === "id"
            ? feature.properties?.id ?? ""
            : col === "coordinates" && isGeoJSON
            ? JSON.stringify(feature.geometry.coordinates)
            : feature.properties?.[col] ?? "";

        const textWidth = measureTextWidth(String(value));
        if (textWidth > maxWidth) {
          maxWidth = textWidth;
        }
      });

      newWidths[col] = maxWidth;
    });

    setColumnWidths(newWidths);
  }, [geojsonData, columns]);

  const handleRowClick = (featureData: any) => {
    let featureToSelect: Feature<Geometry> | null = null;

    if (featureData instanceof Feature) {
      featureToSelect = featureData;
    } else {
      try {
        const geojsonFormat = new GeoJSON();
        const convertedFeature = geojsonFormat.readFeature(featureData, {
          featureProjection: "EPSG:3857",
        });

        if (convertedFeature instanceof Feature) {
          const newId = featureData.properties?.id ?? Math.random();
          convertedFeature.setId(String(newId));
          featureToSelect = convertedFeature;
        }
      } catch (error) {
        console.error("❌ Ошибка конвертации объекта в Feature:", error);
      }
    }

    if (featureToSelect) {
      setSelectedFeature(featureToSelect);
      zoomToFeature(featureToSelect);
    }
  };

  if (!geojsonData || !geojsonData.features?.length) {
    return <p className="no-data">Нет данных</p>;
  }

  return (
    <div className="table-container">
      <table className="feature-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ width: columnWidths[col] ? `${columnWidths[col]}px` : "auto" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {geojsonData.features.map((feature: any, index: number) => {
            const featureId = String(feature.properties?.id ?? index + 1);
            const isSelected = String(selectedId) === featureId;

            return (
              <tr
                key={featureId}
                ref={(el) => {
                rowRefs.current.set(featureId, el);
                }}
                className={isSelected ? "selected" : ""}
                onClick={() => handleRowClick(feature)}
              >
                {columns.map((col) => (
                  <td key={col} style={{ width: columnWidths[col] ? `${columnWidths[col]}px` : "auto" }}>
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