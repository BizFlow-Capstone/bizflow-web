interface JsonTreeProps {
  value: unknown;
}

export default function JsonTree({ value }: JsonTreeProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof value === "string") {
    return (
      <span className="text-emerald-700">
        &quot;
        {value}
        &quot;
      </span>
    );
  }

  if (typeof value === "number") {
    return <span className="text-amber-700">{value}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-violet-700">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <details open className="ml-2">
        <summary className="cursor-pointer text-gray-600">
          [{value.length}]
        </summary>
        <div className="ml-4 border-l border-gray-200 pl-3">
          {value.map((entry, index) => (
            <div key={`${index}-${typeof entry}`} className="leading-6">
              <span className="text-sky-700">{index}</span>
              <span className="mx-2 text-gray-400">:</span>
              <JsonTree value={entry} />
            </div>
          ))}
        </div>
      </details>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  return (
    <details open className="ml-2">
      <summary className="cursor-pointer text-gray-600">
        {"{" + entries.length + "}"}
      </summary>
      <div className="ml-4 border-l border-gray-200 pl-3">
        {entries.map(([key, entry]) => (
          <div key={key} className="leading-6">
            <span className="text-sky-700">{key}</span>
            <span className="mx-2 text-gray-400">:</span>
            <JsonTree value={entry} />
          </div>
        ))}
      </div>
    </details>
  );
}
