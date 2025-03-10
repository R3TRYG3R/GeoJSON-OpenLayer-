import { useRef, useState } from "react";
import { FileUpload } from "../../features/FileUpload/FileUpload";
import { MapPreview } from "../../widgets/MapPreview/MapPreview";
import { FeatureTable } from "../../widgets/FeatureTable/FeatureTable";
import { useSelectedFeature } from "../../context/SelectedFeatureContext"; // ✅ Подключаем контекст

export const ImportPage = () => {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null!);
  const { setSelectedFeature } = useSelectedFeature(); // ✅ Достаём функцию для сброса выделения

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
    setSelectedFeature(null); // ✅ Теперь при очистке карты очищается и выделенный объект

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Импорт</h1>
      <FileUpload onFileParsed={handleFileParsed} inputRef={inputRef} />

      <button
        onClick={handleClearMap}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
      >
        Очистить карту
      </button>

      <h2 className="text-lg font-semibold mt-4">Показ</h2>
      <div
        style={{
          width: "100%",
          height: "500px",
          minHeight: "500px",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          backgroundColor: "lightgray",
          border: "2px solid red",
        }}
      >
        <MapPreview geojsonData={parsedData} />
      </div>

      <h2 className="text-lg font-semibold mt-4">Таблица данных</h2>
      <FeatureTable />
    </div>
  );
};