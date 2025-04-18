import { MapProvider } from "../context/MapContext";
import { SelectedFeatureProvider } from "../context/SelectedFeatureContext";
import { AddModeProvider } from "../context/AddModeContext";
import { MoveModeProvider } from "../context/MoveModeContext"; // 👈 NEW
import { ImportPage } from "../pages/import/ImportPage";

function App() {
  return (
    <MapProvider>
      <SelectedFeatureProvider>
        <AddModeProvider>
          <MoveModeProvider> {/* 👈 Обернули */}
            <ImportPage />
          </MoveModeProvider>
        </AddModeProvider>
      </SelectedFeatureProvider>
    </MapProvider>
  );
}

export default App;