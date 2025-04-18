import { createContext, useContext, useState } from "react";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { Point } from "ol/geom";

interface MoveModeContextType {
  isMoving: boolean;
  movingFeature: Feature<Geometry> | null;
  startMoveMode: (feature: Feature<Geometry>) => void;
  cancelMoveMode: () => void;
  finishMoveMode: (newCoords: number[]) => void;
}

const MoveModeContext = createContext<MoveModeContextType | null>(null);

export const MoveModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMoving, setIsMoving] = useState(false);
  const [movingFeature, setMovingFeature] = useState<Feature<Geometry> | null>(null);

  const startMoveMode = (feature: Feature<Geometry>) => {
    setMovingFeature(feature);
    setIsMoving(true);
  };

  const cancelMoveMode = () => {
    setIsMoving(false);
    setMovingFeature(null);
  };

  const finishMoveMode = (newCoords: number[]) => {
    if (movingFeature?.getGeometry()?.getType() === "Point") {
      const pointGeom = movingFeature.getGeometry() as Point;
      pointGeom.setCoordinates(newCoords);
    }
    cancelMoveMode();
  };

  return (
    <MoveModeContext.Provider
      value={{ isMoving, movingFeature, startMoveMode, cancelMoveMode, finishMoveMode }}
    >
      {children}
    </MoveModeContext.Provider>
  );
};

export const useMoveMode = () => {
  const context = useContext(MoveModeContext);
  if (!context) throw new Error("useMoveMode must be used within MoveModeProvider");
  return context;
};