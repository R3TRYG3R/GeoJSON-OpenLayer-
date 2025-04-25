import React, { useRef, useEffect } from "react";

interface Props {
  onResize: (newHeight: number) => void;
}

export const VerticalSplitter: React.FC<Props> = ({ onResize }) => {
  const isDragging = useRef(false);
  const topY = useRef(0);

  const handleMouseDown = () => {
    const mapEl = document.querySelector(".map-container") as HTMLElement;
    if (mapEl) {
      topY.current = mapEl.getBoundingClientRect().top;
      isDragging.current = true;
      document.body.style.cursor = "row-resize";
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = "";
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const newH = e.clientY - topY.current;
    onResize(Math.max(200, Math.min(newH, window.innerHeight - 200)));
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return <div className="vertical-splitter" onMouseDown={handleMouseDown} />;
};