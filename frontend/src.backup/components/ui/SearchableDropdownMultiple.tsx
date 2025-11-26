'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Plus } from 'lucide-react';

interface Option {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  kategori: string;
}

interface SearchableDropdownMultipleProps {
  options: Option[];
  selectedOptions: Option[];
  onSelect: (option: Option) => void;
  onRemove: (optionId: number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

const SearchableDropdownMultiple: React.FC<SearchableDropdownMultipleProps> = ({
  options,
  selectedOptions,
  onSelect,
  onRemove,
  placeholder = "Cari mata pelajaran...",
  label,
  error,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm) {
      // Tampilkan semua opsi yang belum dipilih
      setFilteredOptions(
        options.filter(option => 
          !selectedOptions.find(selected => selected.id_mata_pelajaran === option.id_mata_pelajaran)
        )
      );
    } else {
      // Filter berdasarkan pencarian dan yang belum dipilih
      const filtered = options.filter(option =>
        (option.nama_mata_pelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
         option.kode_mata_pelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
         option.kategori.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !selectedOptions.find(selected => selected.id_mata_pelajaran === option.id_mata_pelajaran)
      );
      setFilteredOptions(filtered);
    }
  }, [options, selectedOptions, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: Option) => {
    onSelect(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Selected Options */}
      {selectedOptions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Mata Pelajaran Dipilih:</p>
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map(option => (
              <div
                key={option.id_mata_pelajaran}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <span>{option.nama_mata_pelajaran}</span>
                <button
                  type="button"
                  onClick={() => onRemove(option.id_mata_pelajaran)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
        <Plus size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((option) => (
                  <button
                    key={option.id_mata_pelajaran}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                  >
                    <div className="font-medium text-gray-900">{option.nama_mata_pelajaran}</div>
                    <div className="text-sm text-gray-500">{option.kode_mata_pelajaran} - {option.kategori}</div>
                  </button>
                ))}
                
                {filteredOptions.length > 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-t">
                    Menampilkan {filteredOptions.length} dari {options.length - selectedOptions.length} opsi tersedia.
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                {searchTerm ? 'Tidak ada mata pelajaran yang cocok' : 'Semua mata pelajaran sudah dipilih'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdownMultiple;