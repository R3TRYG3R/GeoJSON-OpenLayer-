import { createContext, useContext, useState } from "react";

// Тип контекста
interface GeoDataContextType {
  geojsonData: any;
  setGeojsonData: (data: any) => void;
  selectedFeature: any;
  setSelectedFeature: (feature: any) => void;
  clearGeoData: () => void; // Очистка данных
}

// Создаём контекст
const GeoDataContext = createContext<GeoDataContextType | null>(null);

// Провайдер контекста
export const GeoDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [geojsonData, setGeojsonData] = useState<any | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  // очистка данных
  const clearGeoData = () => {
    console.log("🗑 Очистка всех данных GeoJSON...");
    setGeojsonData(null);
    setSelectedFeature(null);
  };

  return (
    <GeoDataContext.Provider
      value={{
        geojsonData,
        setGeojsonData,
        selectedFeature,
        setSelectedFeature,
        clearGeoData,
      }}
    >
      {children}
    </GeoDataContext.Provider>
  );
};

// Хук для удобного использования контекста
export const useGeoData = () => {
  const context = useContext(GeoDataContext);
  if (!context) {
    throw new Error("useGeoData must be used within GeoDataProvider");
  }
  return context;
};