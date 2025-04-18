import React, { useEffect, useState, useRef } from "react";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useMap } from "../../context/MapContext";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import { EditFeature } from "../../features/DataEditing/EditFeature";
import { EditGeometryModal } from "../../features/DataEditing/EditGeometryModal";
import "./FeatureTable.css";

interface FeatureTableProps {
  geojsonData: any;
  onUpdate: (updated: any) => void;
}

export const FeatureTable: React.FC<FeatureTableProps> = ({ geojsonData, onUpdate }) => {
  const { selectedFeature, setSelectedFeature } = useSelectedFeature();
  const { zoomToFeature } = useMap();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isGeoJSON, setIsGeoJSON] = useState<boolean>(false);
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFeature, setModalFeature] = useState<Feature<Geometry> | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());

  // ✅ Главное исправление: предотвращаем бесконечный цикл
  useEffect(() => {
    if (
      selectedFeature &&
      typeof selectedFeature.getId === "function"
    ) {
      const featureId = selectedFeature.getId();
      setSelectedId(featureId != null ? String(featureId) : null);
    } else {
      setSelectedId(null);
    }
  }, [selectedFeature]);

  useEffect(() => {
    if (!selectedId) return;
  
    const id = String(selectedId); // Явное приведение
  
    if (rowRefs.current.has(id)) {
      rowRefs.current.get(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  
    if (!editingRowId && selectedFeature) {
      zoomToFeature(selectedFeature);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!geojsonData || !geojsonData.features?.length) {
      setColumns([]);
      setIsGeoJSON(false);
      return;
    }

    const firstFeature = geojsonData.features[0];
    let dynamicColumns: string[] = [];

    const isGeoJSONFormat = firstFeature.geometry && firstFeature.geometry.coordinates;
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
            ? "Редактировать координаты"
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
    if (editingRowId) return;

    let featureToSelect: Feature<Geometry> | null = null;

    if (featureData instanceof Feature) {
      featureToSelect = featureData;
    } else {
      try {
        const geojsonFormat = new GeoJSON();
        const convertedFeature = geojsonFormat.readFeature(featureData, {
          featureProjection: "EPSG:3857",
        });

        if (convertedFeature && convertedFeature instanceof Feature) {
          const newId = featureData.properties?.id ?? Math.random();
          convertedFeature.setId(String(newId));
          featureToSelect = convertedFeature;
        } else {
          console.error("❌ readFeature вернул недопустимый результат:", convertedFeature);
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

  const toggleEdit = (rowId: string) => {
    setEditingRowId(editingRowId === rowId ? null : rowId);
  };

  const handleEditChange = (feature: any, key: string, value: string) => {
    feature.properties[key] = value;
    feature.set(key, value);
  };

  const handleGeometryUpdate = () => {
    if (!modalFeature) return;

    const updated = {
      ...geojsonData,
      features: geojsonData.features.map((f: any) => {
        const fId = String(f.properties?.id ?? "");
        const modalId = String(modalFeature.getId());

        if (fId === modalId) {
          const format = new GeoJSON();
          const updatedFeature = format.writeFeatureObject(modalFeature, {
            featureProjection: "EPSG:3857",
            dataProjection: "EPSG:4326",
          });

          return {
            ...f,
            geometry: updatedFeature.geometry,
          };
        }

        return f;
      }),
    };

    onUpdate(updated);
  };

  const handleOpenModal = (feature: any) => {
    let finalFeature: Feature<Geometry> | null = null;

    if (feature instanceof Feature) {
      finalFeature = feature;
    } else {
      try {
        const geojsonFormat = new GeoJSON();
        const result = geojsonFormat.readFeature(feature, {
          featureProjection: "EPSG:3857",
        });

        if (!result || !(result instanceof Feature)) {
          console.error("❌ Ошибка: readFeature не вернул Feature");
          return;
        }

        const id = feature.properties?.id ?? Math.random();
        result.setId(String(id));
        finalFeature = result;
      } catch (error) {
        console.error("❌ Не удалось конвертировать в Feature:", error);
        return;
      }
    }

    setModalFeature(finalFeature);
    setModalOpen(true);
  };

  if (!geojsonData || !geojsonData.features?.length) {
    return <p className="no-data">Нет данных</p>;
  }

  return (
    <div className="table-container">
      <table className="feature-table">
        <thead>
          <tr>
            <th className="edit-cell"></th>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  width: columnWidths[col] ? `${columnWidths[col]}px` : "auto",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {geojsonData.features.map((feature: any, index: number) => {
            const featureId = String(feature.properties?.id ?? index + 1);
            const isSelected = String(selectedId) === featureId;
            const isEditing = editingRowId === featureId;

            return (
              <tr
                key={featureId}
                ref={(el) => {
                  if (el) rowRefs.current.set(featureId, el);
                }}
                className={isSelected ? "selected" : ""}
                onClick={() => handleRowClick(feature)}
              >
                <td className="edit-cell">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEdit(featureId);
                    }}
                    style={{ width: "30px" }}
                  >
                    {isEditing ? "💾" : "✏️"}
                  </button>
                </td>
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      width: columnWidths[col] ? `${columnWidths[col]}px` : "auto",
                    }}
                  >
                    {col === "id" ? (
                      featureId
                    ) : col === "coordinates" && isGeoJSON ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(feature);
                        }}
                      >
                        Редактировать координаты
                      </button>
                    ) : isEditing ? (
                      <EditFeature
                        value={feature.properties?.[col] ?? ""}
                        onChange={(val: string) => handleEditChange(feature, col, val)}
                        onExit={() => {}}
                      />
                    ) : (
                      feature.properties?.[col] ?? ""
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {modalFeature && (
        <EditGeometryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          feature={modalFeature}
          onGeometryUpdate={handleGeometryUpdate}
        />
      )}
    </div>
  );
};