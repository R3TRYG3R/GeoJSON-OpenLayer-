import { createContext, useContext, useState, ReactNode } from "react";

type GeometryType = "Point" | "LineString" | "Polygon" | "MultiPolygon" | "MultiLineString" | null;

interface AddModeContextType {
  isAdding: boolean;
  selectedType: GeometryType;
  startAddMode: (type: GeometryType) => void;
  cancelAddMode: () => void;
}

const AddModeContext = createContext<AddModeContextType | null>(null);

export const AddModeProvider = ({ children }: { children: ReactNode }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<GeometryType>(null);

  const startAddMode = (type: GeometryType) => {
    setSelectedType(type);
    setIsAdding(true);
  };

  const cancelAddMode = () => {
    setIsAdding(false);
    setSelectedType(null);
  };

  return (
    <AddModeContext.Provider value={{ isAdding, selectedType, startAddMode, cancelAddMode }}>
      {children}
    </AddModeContext.Provider>
  );
};

export const useAddMode = () => {
  const context = useContext(AddModeContext);
  if (!context) {
    throw new Error("useAddMode must be used within AddModeProvider");
  }
  return context;
};