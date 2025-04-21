import React, { useEffect, useRef, useState } from "react";
import "./EditGeometryMapModal.css";
import { Map, View } from "ol";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Modify } from "ol/interaction";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature<Geometry>;
  onSave: (updatedFeature: Feature<Geometry>) => void;
}

export const EditGeometryMapModal: React.FC<Props> = ({ isOpen, onClose, feature, onSave }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const vectorLayerRef = useRef<VectorLayer | null>(null);
  const [coordsText, setCoordsText] = useState("");

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const style = new Style({
      fill: new Fill({ color: "rgba(255, 0, 0, 0.2)" }),
      stroke: new Stroke({ color: "red", width: 2 }),
      image: new CircleStyle({ radius: 5, fill: new Fill({ color: "red" }) }),
    });

    const clonedFeature = feature.clone();
    clonedFeature.setId(feature.getId());

    const source = new VectorSource({ features: [clonedFeature] });
    const layer = new VectorLayer({ source, style });

    vectorSourceRef.current = source;
    vectorLayerRef.current = layer;

    const map = new Map({
      target: mapRef.current,
      layers: [layer],
      view: new View({
        center: fromLonLat([47.5769, 40.1431]),
        zoom: 7,
      }),
      controls: [],
    });

    const extent = clonedFeature.getGeometry()?.getExtent();
    if (extent) {
      map.getView().fit(extent, { padding: [20, 20, 20, 20], maxZoom: 16 });
    }

    const modify = new Modify({ source });
    map.addInteraction(modify);
    mapInstance.current = map;

    // 🧭 Координаты (в LonLat) — для просмотра
    const geom = clonedFeature.getGeometry();
    if (geom && "getCoordinates" in geom) {
      const convertCoords = (coord: any): any =>
        typeof coord[0] === "number" ? toLonLat(coord) : coord.map(convertCoords);
      const coords = convertCoords((geom as any).getCoordinates());
      setCoordsText(JSON.stringify(coords, null, 2));
    }

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
    };
  }, [isOpen]);

  const handleSave = () => {
    if (!vectorSourceRef.current) return;
    const updated = vectorSourceRef.current.getFeatures()[0];
    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window large horizontal" onClick={(e) => e.stopPropagation()}>
        <h2>Редактирование геометрии</h2>
        <div className="horizontal-content">
          <textarea
            className="coords-view"
            value={coordsText}
            readOnly
          />
          <div ref={mapRef} className="geometry-edit-map" />
        </div>
        <div className="modal-buttons">
          <button onClick={handleSave} className="btn-save">💾 Сохранить</button>
          <button onClick={onClose} className="btn-cancel">Отмена</button>
        </div>
      </div>
    </div>
  );
};