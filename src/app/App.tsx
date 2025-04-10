import { MapProvider } from "../context/MapContext";
import { SelectedFeatureProvider } from "../context/SelectedFeatureContext";
import { AddModeProvider } from "../context/AddModeContext";
import { ImportPage } from "../pages/import/ImportPage";

function App() {
  return (
    <MapProvider>
      <SelectedFeatureProvider>
        <AddModeProvider>
          <ImportPage />
        </AddModeProvider>
      </SelectedFeatureProvider>
    </MapProvider>
  );
}

export default App;