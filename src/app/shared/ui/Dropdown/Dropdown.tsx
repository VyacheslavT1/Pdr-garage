import React, { useState, useEffect, useRef } from "react";
import styles from "./Dropdown.module.scss";
interface Options {
  value: string;
  label: string;
}

export interface DropdownProps {
  options: Options[];
  className?: string;
  value?: string;
  renderValue?: (option: Options | undefined) => React.ReactNode;
  renderOption?: (option: Options, isActive: boolean) => React.ReactNode;
  onSelect?: (newValue: string) => void;
  onClose?: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  className = "",
  onSelect,
  renderOption,
  renderValue,
  onClose,
  value,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // выходим сразу, если это dropdown для десктопа (нет renderValue)
    if (!renderValue) {
      return;
    }

    const handleTouchOutside = (event: TouchEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener("touchstart", handleTouchOutside);
    return () => {
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [onClose, renderValue]);

  return (
    <div
      ref={wrapperRef}
      className={`${styles.dropdownWrapper} ${className}`}
      onClick={
        renderValue
          ? () => {
              setIsOpen((prev) => !prev);
              if (isOpen) {
                onClose?.();
              }
            }
          : undefined
      }
    >
      {renderValue && renderValue(selectedOption)}

      {(renderValue ? isOpen : true) &&
        options.map((opt) => (
          <div
            key={opt.value}
            onClick={() => {
              onSelect?.(opt.value);
              setIsOpen(false);
              onClose?.();
            }}
            className={styles.dropdownOption}
          >
            {renderOption ? renderOption(opt, opt.value === value) : opt.label}
          </div>
        ))}
    </div>
  );
};

export default Dropdown;
