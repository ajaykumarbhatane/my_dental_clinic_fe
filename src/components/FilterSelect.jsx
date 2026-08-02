import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export default function FilterSelect({
  options = [],
  value = "",
  placeholder = "Select",
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const ref = useRef(null);

  useEffect(() => {
  const handler = (e) => {
    if (!ref.current?.contains(e.target)) {
      setOpen(false);
    }
  };

  document.addEventListener("mousedown", handler);

  return () => {
    document.removeEventListener("mousedown", handler);
  };
}, []);
useEffect(() => {
  const resize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  window.addEventListener("resize", resize);

  return () => {
    window.removeEventListener("resize", resize);
  };
}, []);

  const selected = options.find(
    (o) => String(o.value) === String(value)
  );

  const label = selected?.label || placeholder;

  const shortLabel =
    label.length > 12 ? label.substring(0, 12) + "..." : label;
  
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        type="button"
        title={label}
        onClick={() => {
  setSearch("");

  if (isMobile) {
    setOpen(true);
  } else {
    setOpen(!open);
  }
}}
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

      {open &&
  (isMobile ? (
    <div className="fixed inset-0 z-[9999] bg-black/40">

      <div
  className="
    absolute
    top-20
    left-3
    right-3
    bottom-3

    bg-white

    rounded-2xl

    shadow-2xl

    flex
    flex-col

    overflow-hidden
  "
>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">

          <h2 className="text-lg font-semibold">
            {placeholder}
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="p-2"
          >
            <X className="w-6 h-6" />
          </button>

        </div>

        {/* Search */}
        <div className="p-4">

          <div className="relative">

            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${placeholder}`}
              className="
                w-full
                border
                rounded-xl
                pl-10
                pr-4
                py-3
                focus:outline-none
                focus:border-blue-500
              "
            />

          </div>

        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto">

          {filteredOptions.map((option) => (

            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`
                w-full
                px-5
                py-4
                flex
                items-center
                justify-between
                border-b

                ${
                  String(option.value) === String(value)
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : ""
                }
              `}
            >

              {option.label}

              {String(option.value) === String(value) && (
                <Check className="w-5 h-5" />
              )}

            </button>

          ))}

        </div>

      </div>

    </div>
  ) : (
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
  ))}
    </div>
  );
}