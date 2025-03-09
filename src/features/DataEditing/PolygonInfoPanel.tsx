import { useState } from "react";
import { useGeoData } from "../../context/GeoDataContext";

export const PolygonInfoPanel = () => {
  const { geojsonData, setGeojsonData } = useGeoData();
  const [editedData, setEditedData] = useState(geojsonData);

  // ✅ Функция для обновления значений в таблице
  const handleEdit = (featureIndex: number, key: string, value: string) => {
    const updatedData = { ...editedData };
    updatedData.features[featureIndex].properties[key] = value;
    setEditedData(updatedData);
  };

  // ✅ Функция для применения изменений
  const applyChanges = () => {
    setGeojsonData(editedData);
    console.log("✅ Измененные данные:", editedData);
  };

  if (!geojsonData || !geojsonData.features?.length) {
    return null; // Если данных нет, скрываем панель
  }

  return (
    <div className="p-4 border-t mt-4 bg-white shadow">
      <h2 className="text-lg font-semibold">📌 Информация о полигонах</h2>

      {geojsonData.features.map((feature: any, index: number) => (
        <div key={index} className="mt-2 p-2 border rounded">
          <h3 className="font-medium">Полигон {index + 1}</h3>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className="border border-gray-400 px-2 py-1">Атрибут</th>
                <th className="border border-gray-400 px-2 py-1">Значение</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(feature.properties).map(([key, value]) => (
                <tr key={key}>
                  <td className="border border-gray-400 px-2 py-1">{key}</td>
                  <td className="border border-gray-400 px-2 py-1">
                    <input
                      type="text"
                      className="w-full border px-1 py-0.5"
                      value={String(value)} // ✅ Приводим к строке, чтобы избежать ошибки
                      onChange={(e) => handleEdit(index, key, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <button
        onClick={applyChanges}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
      >
        Сохранить изменения
      </button>
    </div>
  );
};