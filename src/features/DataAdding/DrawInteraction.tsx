import { useEffect } from "react";
import { Draw } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useMap } from "../../context/MapContext";
import { useAddMode } from "../../context/AddModeContext";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

interface Props {
  onDrawEnd: (feature: Feature<Geometry>) => void;
}

export const DrawInteraction: React.FC<Props> = ({ onDrawEnd }) => {
  const { mapInstance, isMapReady } = useMap();
  const { selectedType, cancelAddMode } = useAddMode();

  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !selectedType) return;

    const map = mapInstance.current;

    const source = new VectorSource();
    const layer = new VectorLayer({ source });
    map.addLayer(layer);

    const draw = new Draw({
      source,
      type: selectedType,
    });

    map.addInteraction(draw);

    draw.on("drawend", (event) => {
      const drawnFeature = event.feature;
      console.log("🆕 Нарисован объект:", drawnFeature);
      onDrawEnd(drawnFeature);
      cancelAddMode();
    });

    return () => {
      map.removeInteraction(draw);
      map.removeLayer(layer);
    };
  }, [isMapReady, mapInstance, selectedType]);

  return null;
};