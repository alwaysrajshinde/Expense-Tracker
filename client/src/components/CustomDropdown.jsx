import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  icon: PrefixIcon = null,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  searchable = false,
  ariaLabel = 'Dropdown'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options into { value, label, icon, color }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.value !== undefined ? opt.value : opt.id || opt.name,
      label: opt.label !== undefined ? opt.label : opt.name || String(opt.value),
      icon: opt.icon,
      color: opt.color
    };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Filter options if searchable
  const filteredOptions = searchable && search.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : normalizedOptions;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen, searchable]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer text-xs font-semibold select-none ${
          isOpen
            ? 'border-[#6C47FF] ring-2 ring-[#6C47FF]/20 bg-purple-50/50 dark:bg-purple-950/30 text-[#6C47FF] dark:text-[#A78BFA]'
            : 'border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#1A162E] text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-white/20'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {PrefixIcon && <PrefixIcon size={14} className="text-[#6C47FF] dark:text-[#A78BFA] flex-shrink-0" />}
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform duration-200 text-slate-400 ${
            isOpen ? 'transform rotate-180 text-[#6C47FF] dark:text-[#A78BFA]' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1.5 w-full min-w-[190px] max-w-[280px] bg-white dark:bg-[#16132A] border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-slide-up ${menuClassName}`}
        >
          {/* Optional Search Bar */}
          {searchable && normalizedOptions.length > 7 && (
            <div className="p-2 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <Search size={12} className="text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter..."
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-slate-400">
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#6C47FF] text-white font-bold shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {opt.color && (
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isSelected ? 'ring-2 ring-white/50' : ''
                          }`}
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check size={14} className="flex-shrink-0 ml-1 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
