import { useState } from "react";
import { parseCSV } from "../FileParsing/parseCSV";
import { parseGeoJSON } from "../FileParsing/parseGeoJSON";
import { parseShapefile } from "../FileParsing/parseShapefile";

interface FileUploadProps {
  onFileParsed: (data: any) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const FILE_LIMITS: Record<string, number> = {
  csv: 50 * 1024 * 1024, // 50MB
  json: 30 * 1024 * 1024,
  geojson: 30 * 1024 * 1024,
  zip: 50 * 1024 * 1024,
};

export const FileUpload: React.FC<FileUploadProps> = ({ onFileParsed, inputRef }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const limit = ext && FILE_LIMITS[ext];

    if (!ext || !(ext in FILE_LIMITS)) {
      setError("Разрешены только файлы CSV, GeoJSON (.json, .geojson) или Shapefile (.zip)");
      return;
    }

    if (typeof limit === "number" && file.size > limit)  {
      setError(`Файл слишком большой. Максимальный размер: ${(limit! / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    try {
      let parsedData = null;

      if (ext === "csv") {
        parsedData = await parseCSV(file);
      } else if (ext === "json" || ext === "geojson") {
        parsedData = await parseGeoJSON(file);
      } else if (ext === "zip") {
        parsedData = await parseShapefile(file);
      }

      if (parsedData) {
        setError(null);
        onFileParsed(parsedData);
      } else {
        setError("Не удалось прочитать файл.");
      }
    } catch (err) {
      console.error("❌ Ошибка при чтении файла:", err);
      setError("Ошибка при чтении файла. Проверьте формат и структуру.");
    }
  };

  return (
    <div>
      <label htmlFor="file-upload" className="upload-button">
        Загрузить файл
      </label>
      <input
        type="file"
        id="file-upload"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv,.json,.geojson,.zip"
      />
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};