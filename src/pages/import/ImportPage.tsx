import { useRef, useState } from "react";
import { FileUpload } from "../../features/FileUpload/FileUpload";
import { MapPreview } from "../../widgets/MapPreview/MapPreview";
import { FeatureTable } from "../../widgets/FeatureTable/FeatureTable";
import "./ImportPage.css"; 

export const ImportPage = () => {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null!);

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

  return (
    <div className="import-container">
      {/* Шапка с кнопками */}
      <div className="import-header">
        <h1 className="import-title">Импорт</h1>
        <div className="import-buttons">
          <FileUpload onFileParsed={handleFileParsed} inputRef={inputRef} />
          <button onClick={handleClearMap} className="clear-button">
            Очистить карту
          </button>
        </div>
      </div>

      {/* Карта */}
      <div className="map-container">
        <MapPreview geojsonData={parsedData || { type: "FeatureCollection", features: [] }} />
      </div>

      {/* Таблица */}
      <div className="table-wrapper">
        <h2 className="table-title">Таблица данных</h2>
        <FeatureTable geojsonData={parsedData} />
      </div>
    </div>
  );
};