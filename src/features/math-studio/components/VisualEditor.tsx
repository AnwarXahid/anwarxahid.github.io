import { useEffect, useRef, useState } from "react";
import "mathlive/fonts.css";

export default function VisualEditor({
  value,
  onExpression,
}: {
  value: string;
  onExpression: (value: string, latex: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState("Loading visual math keyboard…");
  useEffect(() => {
    let live = true;
    let element: any;
    void import("mathlive")
      .then(({ MathfieldElement }) => {
        if (!live || !host.current) return;
        element = new MathfieldElement();
        element.setAttribute("aria-label", "Visual math editor");
        element.style.width = "100%";
        element.value = value;
        element.addEventListener("input", () => {
          const ascii = element.getValue("ascii-math");
          onExpression(ascii, element.getValue("latex"));
        });
        host.current.append(element);
        setState("");
      })
      .catch((e) => setState(`Visual editor unavailable: ${String(e)}`));
    return () => {
      live = false;
      element?.remove();
    };
  }, []);
  return (
    <div className="ms-visual">
      <div ref={host}></div>
      {state && <p role="status">{state}</p>}
      <p className="ms-hint">
        Tap the field to open the math keyboard. Its ASCII expression is sent to
        Solve and Graph.
      </p>
    </div>
  );
}
