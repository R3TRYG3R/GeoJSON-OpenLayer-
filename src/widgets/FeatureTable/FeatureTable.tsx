import { JSX } from "react";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { Point, LineString, Polygon } from "ol/geom";
import { toLonLat } from "ol/proj"; // ✅ Добавляем функцию для перевода координат

export const FeatureTable = () => {
  const { selectedFeature } = useSelectedFeature();

  if (!selectedFeature) {
    return <p className="text-gray-500">Выберите объект на карте</p>;
  }

  // ✅ Извлекаем свойства объекта
  const properties = selectedFeature.getProperties();

  // ✅ Извлекаем геометрию (координаты)
  const geometry = selectedFeature.getGeometry();
  let coordinates: string | JSX.Element | null = null;
  let geometryType = "Не определено";

  // ✅ Определяем, является ли источник GeoJSON
  const isGeoJSON = !properties.latitude && !properties.longitude;

  if (geometry) {
    geometryType = geometry.getType();

    try {
      if (geometry instanceof Point) {
        // ✅ Точка (Point)
        const coord = toLonLat(geometry.getCoordinates()); // 📌 Конвертируем обратно в широту-долготу
        coordinates = isGeoJSON
          ? `📍 ${coord[1]}, ${coord[0]}`
          : null;
      } else if (geometry instanceof LineString) {
        // ✅ Линия (LineString) - список координат
        coordinates = isGeoJSON ? (
          <ul className="mt-2 text-sm">
            {geometry.getCoordinates().map((coord, i) => {
              const [lon, lat] = toLonLat(coord); // 📌 Конвертируем
              return (
                <li key={i} className="text-gray-700">
                  {`📍 ${lat}, ${lon}`}
                </li>
              );
            })}
          </ul>
        ) : null;
      } else if (geometry instanceof Polygon) {
        // ✅ Полигон (Polygon) - список координат внешнего кольца
        coordinates = isGeoJSON ? (
          <ul className="mt-2 text-sm">
            {geometry.getCoordinates()[0]?.map((coord, i) => {
              const [lon, lat] = toLonLat(coord); // 📌 Конвертируем
              return (
                <li key={i} className="text-gray-700">
                  {`📍 ${lat}, ${lon}`}
                </li>
              );
            })}
          </ul>
        ) : null;
      }
    } catch (error) {
      console.error("❌ Ошибка при обработке координат:", error);
      coordinates = "⚠️ Ошибка при обработке координат";
    }
  }

  return (
    <div className="overflow-x-auto mt-4 border rounded-lg">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Свойство</th>
            <th className="border border-gray-300 px-4 py-2">Значение</th>
          </tr>
        </thead>
        <tbody>
          {/* ✅ Показываем тип геометрии (Один раз) */}
          <tr className="border-t border-gray-300">
            <td className="border border-gray-300 px-4 py-2 font-bold">Тип геометрии</td>
            <td className="border border-gray-300 px-4 py-2">{geometryType}</td>
          </tr>
          
          {/* ✅ Показываем свойства объекта, кроме geometry */}
          {Object.entries(properties)
                  .filter(([key]) => key !== "geometry" && key !== "geometryType") // Исключаем geometryType
                  .map(([key, value]) => (
              <tr key={key} className="border-t border-gray-300">
                <td className="border border-gray-300 px-4 py-2">{key}</td>
                <td className="border border-gray-300 px-4 py-2">{String(value)}</td>
              </tr>
            ))}

          {/* ✅ Показываем координаты ТОЛЬКО если это GeoJSON */}
          {isGeoJSON && coordinates && (
            <tr className="border-t border-gray-300">
              <td className="border border-gray-300 px-4 py-2 font-bold">Координаты</td>
              <td className="border border-gray-300 px-4 py-2">{coordinates}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};