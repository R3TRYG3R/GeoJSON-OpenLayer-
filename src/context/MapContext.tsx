import { View , Map} from "ol";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import { OSM } from "ol/source";
import { createContext, useContext, useRef, RefObject, useEffect, useState } from "react";

interface MapContextType {
  mapRef: RefObject<HTMLDivElement>;
  mapInstance: RefObject<Map | null>;
  isMapReady: boolean;
}

export const AZERBAIJAN_CENTER = [47.5769, 40.1431];
export  const AZERBAIJAN_ZOOM = 7.5;

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
    const [isMapReady, setIsMapReady] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      console.error("❌ mapRef.current не найден, карта не будет создана!");
      return;
    }

    console.log("📌 mapRef.current найден, инициализируем карту...");

    mapInstance.current = new Map({
      target: mapRef.current!,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(AZERBAIJAN_CENTER),
        zoom: AZERBAIJAN_ZOOM,
      }),
    });

    setIsMapReady(true);

    return () => {
      mapInstance.current?.setTarget(undefined);
    };
  }, [mapRef]);

  return (
    <MapContext.Provider value={{ mapRef, mapInstance, isMapReady }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("MapProvider!!!");
  }
  return context;
};