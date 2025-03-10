import { createContext, useContext, useState } from "react";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";

interface SelectedFeatureContextType {
  selectedFeature: Feature<Geometry> | null;
  setSelectedFeature: (feature: Feature<Geometry> | null) => void;
}

const SelectedFeatureContext = createContext<SelectedFeatureContextType | null>(null);

export const SelectedFeatureProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedFeature, setSelectedFeature] = useState<Feature<Geometry> | null>(null);

  return (
    <SelectedFeatureContext.Provider value={{ selectedFeature, setSelectedFeature }}>
      {children}
    </SelectedFeatureContext.Provider>
  );
};

export const useSelectedFeature = () => {
  const context = useContext(SelectedFeatureContext);
  if (!context) {
    throw new Error("useSelectedFeature must be used within a SelectedFeatureProvider");
  }
  return context;
};