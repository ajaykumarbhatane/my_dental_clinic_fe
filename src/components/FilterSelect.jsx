import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function FilterSelect({
  options = [],
  value = "",
  placeholder = "Select",
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(
    (o) => String(o.value) === String(value)
  );

  const label = selected?.label || placeholder;

  const shortLabel =
    label.length > 12 ? label.substring(0, 12) + "..." : label;

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        type="button"
        title={label}
        onClick={() => setOpen(!open)}
        className="
        w-full
        h-12
        border-2
        border-gray-200
        rounded-xl
        bg-white
        px-4
        text-left
        flex
        items-center
        justify-between
        shadow-sm
        hover:border-blue-400
        focus:border-blue-500
        transition
      "
      >
        <span className="truncate text-sm">
          {shortLabel}
        </span>

        <ChevronDown
          className={`w-4 h-4 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl bg-white shadow-xl border max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              title={option.label}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="
                w-full
                px-4
                py-3
                text-left
                hover:bg-blue-50
                flex
                justify-between
                items-center
              "
            >
              <span>{option.label}</span>

              {String(option.value) === String(value) && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}