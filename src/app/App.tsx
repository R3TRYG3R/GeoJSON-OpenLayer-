import { MapProvider } from "../context/MapContext";
import { SelectedFeatureProvider } from "../context/SelectedFeatureContext";
import { ImportPage } from "../pages/import/ImportPage";

function App() {
  return (
    <MapProvider>
      <SelectedFeatureProvider> {/* Оборачиваем провайдер выделенного объекта */}
        <ImportPage />
      </SelectedFeatureProvider>
    </MapProvider>
  );
}

export default App;