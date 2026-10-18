import katex from "katex";
import "katex/dist/katex.min.css";

export default function Preview({ value }: { value: string }) {
  let rendered = "";
  try {
    rendered = katex.renderToString(value, {
      throwOnError: true,
      trust: false,
      maxExpand: 100,
      maxSize: 10,
      output: "htmlAndMathml",
    });
  } catch {}
  return (
    <div className="ms-preview">
      <span>LIVE PREVIEW</span>
      {rendered ? (
        <div dangerouslySetInnerHTML={{ __html: rendered }} />
      ) : (
        <p>
          Enter valid LaTeX in the visual field to preview. Standard notation
          remains editable above.
        </p>
      )}
    </div>
  );
}
