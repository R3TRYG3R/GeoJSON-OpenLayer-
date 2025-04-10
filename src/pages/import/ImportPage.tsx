import { useRef, useState, useMemo } from "react";
import { FileUpload } from "../../features/FileUpload/FileUpload";
import { MapPreview } from "../../widgets/MapPreview/MapPreview";
import { FeatureTable } from "../../widgets/FeatureTable/FeatureTable";
import { AddFeatureModal } from "../../features/DataAdding/AddFeatureModal";
import "./ImportPage.css";

export const ImportPage = () => {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null!);

  const geometryTypes = useMemo(() => {
    const types = new Set<string>();
    parsedData?.features?.forEach((f: any) => {
      if (f.geometry?.type) types.add(f.geometry.type);
    });
    return Array.from(types);
  }, [parsedData]);

  const handleFileParsed = (data: any) => {
    try {
      if (!data || !data.features || !Array.isArray(data.features)) {
        throw new Error("❌ Некорректный формат данных. Ожидался GeoJSON.");
      }
      console.log("📥 Данные переданы в ImportPage:", data);
      setParsedData(data);
    } catch (error) {
      console.error("❌ Ошибка при обработке данных в ImportPage:", error);
    }
  };

  const handleClearMap = () => {
    console.log("🗑 Очищаем карту и сбрасываем данные...");
    setParsedData(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleAddPoint = () => {
    setAddMode(true);       // Активируем режим добавления
    setModalOpen(false);    // Закрываем модалку
  };

  const handleAddFeatureOnMapClick = (lonLat: [number, number]) => {
    const newId = (parsedData?.features.length ?? 0) + 1;

    const newFeature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: lonLat,
      },
      properties: {
        id: newId,
        name: `New Point ${newId}`,
      },
    };

    const updated = {
      ...parsedData,
      features: [...(parsedData?.features || []), newFeature],
    };

    setParsedData(updated);
    setAddMode(false); // Выключаем режим добавления после одного клика
  };

  return (
    <div className="import-container">
      {/* Шапка */}
      <div className="import-header">
        <h1 className="import-title">Импорт</h1>
        <div className="import-buttons">
          <FileUpload onFileParsed={handleFileParsed} inputRef={inputRef} />

          <button
            className="add-button"
            onClick={() => setModalOpen(true)}
            disabled={!parsedData}
          >
            ➕ Добавить объект
          </button>

          <button className="clear-button" onClick={handleClearMap}>
            🗑 Очистить карту
          </button>
        </div>
      </div>

      {/* Карта */}
      <div className="map-container">
        <MapPreview
          geojsonData={parsedData || { type: "FeatureCollection", features: [] }}
          addMode={addMode}
          onAddFeature={handleAddFeatureOnMapClick}
        />
      </div>

      {/* Таблица */}
      <div className="table-wrapper">
        <h2 className="table-title">Таблица данных</h2>
        <FeatureTable geojsonData={parsedData} onUpdate={setParsedData} />
      </div>

      {/* Модальное окно выбора типа */}
      <AddFeatureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        types={geometryTypes}
        onAddPoint={handleAddPoint}
      />
    </div>
  );
};