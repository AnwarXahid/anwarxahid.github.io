// The same SVG icons the Lab page uses, so a tool looks the same everywhere.
const icons = import.meta.glob<string>("../../../_includes/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type ToolIconName =
  | "pdf"
  | "compress"
  | "convert"
  | "background"
  | "ocr"
  | "compare"
  | "clean"
  | "json"
  | "qr"
  | "quickpass"
  | "drop";

export default function ToolIcon({
  name,
  className = "upload-symbol",
}: {
  name: ToolIconName;
  className?: string;
}) {
  return (
    <span
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: icons[`../../../_includes/icons/${name}.svg`] ?? "",
      }}
    />
  );
}
