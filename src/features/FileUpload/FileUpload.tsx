import { useState } from "react";
import { parseFile } from "../FileParsing";

const FILE_LIMITS = {
  csv: 500 * 1024, // 500 KB
  geojson: 1 * 1024 * 1024, // 1 MB
  zip: 2 * 1024 * 1024, // 500 KB
};

const getFileExtension = (filename: string) => filename.split(".").pop()?.toLowerCase();

export const FileUpload = ({
  onFileParsed,
  inputRef, // ✅ Добавили ref
}: {
  onFileParsed: (data: any) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = getFileExtension(file.name);
    if (!ext || !(ext in FILE_LIMITS)) {
      setError("CSV, GeoJSON or Shapefile.");
      return;
    }

    if (file.size > FILE_LIMITS[ext as keyof typeof FILE_LIMITS]) {
      setError(`Файл слишком большой, макс размер: ${FILE_LIMITS[ext as keyof typeof FILE_LIMITS] / 1024} KB.`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const parsedData = await parseFile(file);
      onFileParsed(parsedData);
    } catch (err) {
      setError("Не получилось прочитать файл.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 border rounded-lg border-gray-600">
      {/* ✅ Теперь inputRef привязан к input */}
      <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" ref={inputRef} />
      <label
        htmlFor="file-upload"
        className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
      </label>
      {loading && <p className="text-blue-500 text-sm">Fayl yüklənir...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};