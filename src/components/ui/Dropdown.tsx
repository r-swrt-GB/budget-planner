import { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

export function Dropdown({ trigger, items, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
