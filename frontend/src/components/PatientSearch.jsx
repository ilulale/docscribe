import { useState, useEffect, useRef } from "react";
import { searchPatients, createPatient } from "../api/endpoints";
import useDebounce from "../hooks/useDebounce";

export default function PatientSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowCreate(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchPatients(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function handleSelect(patient) {
    setQuery(patient.name);
    setResults([]);
    onSelect(patient);
  }

  async function handleCreate() {
    if (!createName.trim()) return;
    const patient = await createPatient(createName.trim());
    setCreateName("");
    setQuery(patient.name);
    setResults([]);
    setShowCreate(false);
    onSelect(patient);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        placeholder="Search patient by name..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowCreate(false);
        }}
        className="input"
      />
      {loading && (
        <div className="absolute right-3 top-2.5 text-2xs text-muted">
          Searching...
        </div>
      )}
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1.5 bg-white border border-border rounded-xl shadow-lift max-h-60 overflow-y-auto animate-scale-in">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-3 hover:bg-canvas transition-colors border-b border-border-subtle last:border-0 first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-2xs font-semibold text-accent shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-2xs text-muted">ID: {p.id}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {query.trim() &&
        !loading &&
        results.length === 0 &&
        debouncedQuery === query.trim() && (
          <div className="absolute z-10 w-full mt-1.5 bg-white border border-border rounded-xl shadow-lift p-4 animate-scale-in">
            <p className="text-xs text-muted mb-3">
              No patients found matching &ldquo;{query}&rdquo;
            </p>
            {showCreate ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Patient name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="input flex-1"
                  autoFocus
                />
                <button onClick={handleCreate} className="btn-primary text-xs">
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setCreateName("");
                  }}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setCreateName(query);
                  setShowCreate(true);
                }}
                className="btn-primary text-xs"
              >
                Create new patient &ldquo;{query}&rdquo;
              </button>
            )}
          </div>
        )}
    </div>
  );
}
