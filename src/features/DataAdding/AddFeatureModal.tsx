import "./AddFeatureModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  types: string[];
  onAddPoint: () => void;
}

export const AddFeatureModal: React.FC<Props> = ({ isOpen, onClose, types, onAddPoint }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <h2>Добавление объекта</h2>

        <label htmlFor="geom-select" style={{ fontSize: "14px", marginBottom: "8px" }}>
          Тип геометрии:
        </label>
        <select
          id="geom-select"
          style={{ width: "100%", padding: "8px", fontSize: "14px" }}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value === "Point") {
              onAddPoint();
            }
          }}
        >
          <option value="" disabled>
            Выберите тип
          </option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="modal-buttons">
          <button className="btn-cancel" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};