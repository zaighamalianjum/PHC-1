/**
 * CitySearchSelect.tsx
 * Searchable Combobox for City ID (Punjab Province & Pakistan)
 * Allows real-time search by City Name or City ID with keyboard navigation and quick-add support.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, MapPin, Plus, Building2 } from 'lucide-react';
import { City } from '../../types';

interface CitySearchSelectProps {
  cities: City[];
  selectedCityId: number;
  onSelectCity: (cityId: number, city?: City) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showAddShortcut?: boolean;
  onQuickAddCity?: (cityName: string) => void | Promise<void>;
  helperText?: string;
  id?: string;
}

export const CitySearchSelect: React.FC<CitySearchSelectProps> = ({
  cities = [],
  selectedCityId,
  onSelectCity,
  label = 'City ID (Punjab Province)',
  placeholder = 'Type to search city (e.g. Lahore, Multan, Rawalpindi)...',
  required = false,
  disabled = false,
  className = '',
  showAddShortcut = true,
  onQuickAddCity,
  helperText,
  id = 'city-search-select'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isAddingQuickCity, setIsAddingQuickCity] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Find currently selected city object
  const selectedCity = useMemo(() => {
    return cities.find(c => Number(c.CityID) === Number(selectedCityId)) || null;
  }, [cities, selectedCityId]);

  // Synchronize input text with selected city when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      if (selectedCity) {
        setSearchQuery(selectedCity.CityName);
      } else if (cities.length > 0) {
        const first = cities[0];
        setSearchQuery(first.CityName);
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedCity, isOpen, cities]);

  // Filter cities by search term
  const filteredCities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cities;

    // If query matches currently selected city exactly while closed or newly opened, return all
    if (selectedCity && selectedCity.CityName.toLowerCase() === query && !isOpen) {
      return cities;
    }

    return cities.filter(c => {
      const nameMatch = c.CityName.toLowerCase().includes(query);
      const idMatch = c.CityID.toString().includes(query);
      const provinceMatch = (c as any).Province?.toLowerCase()?.includes(query);
      return nameMatch || idMatch || provinceMatch;
    });
  }, [cities, searchQuery, selectedCity, isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCities]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (city: City) => {
    onSelectCity(Number(city.CityID), city);
    setSearchQuery(city.CityName);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      // Select text on focus for easy replacement
      if (inputRef.current) {
        inputRef.current.select();
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filteredCities.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredCities.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCities[highlightedIndex]) {
          handleSelect(filteredCities[highlightedIndex]);
        } else if (searchQuery.trim() && onQuickAddCity) {
          handleQuickAdd();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        if (selectedCity) {
          setSearchQuery(selectedCity.CityName);
        }
      }
    }
  };

  const handleQuickAdd = async () => {
    const rawName = searchQuery.trim();
    if (!rawName || !onQuickAddCity) return;
    
    try {
      setIsAddingQuickCity(true);
      await onQuickAddCity(rawName);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to quick add city:', err);
    } finally {
      setIsAddingQuickCity(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`} id={`${id}-wrapper`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xxs font-bold text-slate-600 uppercase tracking-wider">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {selectedCity && (
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              City ID: #{selectedCity.CityID}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-2.5 text-slate-400 pointer-events-none flex items-center">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <input
          id={id}
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`w-full text-xs font-semibold pl-8 pr-16 py-2 border rounded-lg transition-all focus:outline-none bg-white text-slate-800 ${
            isOpen
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
        />

        <div className="absolute right-2 flex items-center space-x-1">
          {searchQuery && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
            title={isOpen ? 'Close city list' : 'Open city list'}
            tabIndex={-1}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[10px] text-slate-400 italic">{helperText}</p>
      )}

      {/* Dropdown Floating Options Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Header summary banner */}
          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-600" />
              {filteredCities.length} Cities Found
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Use ↑↓ & Enter</span>
          </div>

          {/* List of Matching Cities */}
          <ul ref={listRef} className="max-h-56 overflow-y-auto divide-y divide-slate-50 text-xs">
            {filteredCities.length > 0 ? (
              filteredCities.map((city, index) => {
                const isSelected = Number(city.CityID) === Number(selectedCityId);
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={city.CityID}
                    onClick={() => handleSelect(city)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted ? 'bg-emerald-50 text-emerald-950 font-bold' : isSelected ? 'bg-emerald-50/50 text-slate-900 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isSelected || isHighlighted ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{city.CityID}
                      </span>
                      <span className="text-xs font-semibold">{city.CityName}</span>
                      {(city as any).Province && (
                        <span className="text-[10px] text-slate-400 font-normal">({(city as any).Province})</span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-4 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  No registered city matches "<span className="font-bold text-slate-700">{searchQuery}</span>"
                </p>
                {showAddShortcut && searchQuery.trim() && onQuickAddCity && (
                  <button
                    type="button"
                    onClick={handleQuickAdd}
                    disabled={isAddingQuickCity}
                    className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingQuickCity ? 'Adding City...' : `Add "${searchQuery.trim()}" to Cities`}</span>
                  </button>
                )}
              </li>
            )}
          </ul>

          {/* Footer bar with quick hint */}
          <div className="bg-slate-50 px-3 py-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Punjab Province & Nationwide Locations</span>
            <span>Punjab Homeopathic Clinic (PHC)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySearchSelect;
