import React, { useEffect, useState, useRef } from "react";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useMap } from "../../context/MapContext";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import { EditFeature } from "../../features/DataEditing/EditFeature";
import { EditGeometryModal } from "../../features/DataEditing/EditGeometryModal";
import { EditGeometryMapModal } from "../../features/DataEditing/EditGeometryMapModal"; // ✅ новый модал
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

  useEffect(() => {
    if (selectedFeature?.getId) {
      const id = selectedFeature.getId();
      setSelectedId(id != null ? String(id) : null);
    } else {
      setSelectedId(null);
    }
  }, [selectedFeature]);

  useEffect(() => {
    if (!selectedId) return;

    const id = String(selectedId);
    const row = rowRefs.current.get(id);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
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

  useEffect(() => {
    if (!geojsonData || !geojsonData.features?.length) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    context.font = "14px Arial";
    const newWidths: { [key: string]: number } = {};

    columns.forEach((col) => {
      let maxWidth = context.measureText(col).width + 16;

      geojsonData.features.forEach((feature: any) => {
        const value =
          col === "id"
            ? feature.properties?.id ?? ""
            : col === "coordinates" && isGeoJSON
            ? "Редактировать координаты"
            : feature.properties?.[col] ?? "";

        const textWidth = context.measureText(String(value)).width + 16;
        if (textWidth > maxWidth) {
          maxWidth = textWidth;
        }
      });

      newWidths[col] = maxWidth;
    });

    setColumnWidths(newWidths);
  }, [geojsonData, columns]);

  const toggleEdit = (rowId: string) => {
    setEditingRowId(editingRowId === rowId ? null : rowId);
  };

  const handleEditChange = (feature: any, key: string, value: string) => {
    feature.properties[key] = value;
    feature.set(key, value);
  };

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
        }
      } catch (error) {
        console.error("❌ Ошибка при конвертации объекта в Feature:", error);
      }
    }

    if (featureToSelect) {
      setSelectedFeature(featureToSelect);
      zoomToFeature(featureToSelect);
    }
  };

  const handleOpenModal = (feature: any) => {
    try {
      const geojsonFormat = new GeoJSON();
      const result = geojsonFormat.readFeature(feature, {
        featureProjection: "EPSG:3857",
      });
  
      if (!result || Array.isArray(result)) {
        console.error("❌ readFeature вернул массив или null, ожидался одиночный Feature");
        return;
      }
  
      const id = feature.properties?.id ?? Math.random();
      result.setId(String(id));
  
      setModalFeature(result);
      setModalOpen(true);
    } catch (error) {
      console.error("❌ Не удалось прочитать Feature:", error);
    }
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

  const handleUpdatedFeature = (updatedFeature: Feature<Geometry>) => {
    const updated = {
      ...geojsonData,
      features: geojsonData.features.map((f: any) => {
        const fId = String(f.properties?.id ?? f.id);
        const updId = String(updatedFeature.getId());
        if (fId === updId) {
          const format = new GeoJSON();
          const updatedObj = format.writeFeatureObject(updatedFeature, {
            featureProjection: "EPSG:3857",
            dataProjection: "EPSG:4326",
          });

          return {
            ...f,
            geometry: updatedObj.geometry,
          };
        }
        return f;
      }),
    };

    onUpdate(updated);
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

      {/* 🧠 Модальные окна в зависимости от типа */}
      {modalFeature && modalOpen && (
        modalFeature.getGeometry()?.getType() === "Point" ? (
          <EditGeometryModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            feature={modalFeature}
            onGeometryUpdate={handleGeometryUpdate}
          />
        ) : (
          <EditGeometryMapModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            feature={modalFeature}
            onSave={handleUpdatedFeature}
          />
        )
      )}
    </div>
  );
};