"use client";

import { useState, useRef, useEffect } from "react";

const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const NavigationIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export default function SearchBar({ onSelect }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef(null);

    const handleSearch = (value) => {
        setQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=in&limit=5`;
                const res = await fetch(url);
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (error) {
                console.error("Search error", error);
            }
        }, 300);
    };

    const handleSelect = (s) => {
        setQuery(s.display_name.split(',')[0]);
        setSuggestions([]);
        setShowSuggestions(false);

        // Pass formatted place object to parent
        onSelect({
            name: s.display_name,
            geometry: {
                coordinates: [parseFloat(s.lon), parseFloat(s.lat)]
            }
        });
    };

    return (
        <div className="absolute top-4 left-0 right-0 z-[100] px-4 pointer-events-none flex flex-col items-center">
            <div className="w-full max-w-md pointer-events-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center p-3 transition-shadow hover:shadow-xl">
                    <div className="ml-2 mr-3">
                        <SearchIcon />
                    </div>
                    <input
                        className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
                        placeholder="Search destination..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); }}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* Suggestions Panel */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto">
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(s)}
                                className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-start gap-4 border-b border-gray-50 last:border-0 transition-colors group"
                            >
                                <div className="mt-1 p-2 bg-gray-100 rounded-full text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <NavigationIcon />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{s.display_name.split(',')[0]}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-[250px]">{s.display_name}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
