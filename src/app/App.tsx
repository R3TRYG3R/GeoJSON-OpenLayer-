import { MapProvider } from "../context/MapContext";
import { ImportPage } from "../pages/import/ImportPage";

function App() {
  return (
    <MapProvider>
      <ImportPage />
    </MapProvider>
  );
}

export default App;