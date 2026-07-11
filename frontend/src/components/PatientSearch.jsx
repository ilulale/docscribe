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
        className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-gray-400">Searching...</div>
      )}
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500">ID: {p.id}</div>
            </button>
          ))}
        </div>
      )}
      {query.trim() && !loading && results.length === 0 && debouncedQuery === query.trim() && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4">
          <p className="text-gray-500 mb-3">No patients found matching "{query}"</p>
          {showCreate ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Patient name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateName("");
                }}
                className="text-gray-500 hover:text-gray-700 px-3 py-2"
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create new patient "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
