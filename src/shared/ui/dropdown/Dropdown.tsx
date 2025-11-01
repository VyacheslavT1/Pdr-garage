"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import styles from "./Dropdown.module.css";

interface Options { value: string; label: string }

export interface DropdownProps {
  options: Options[];
  className?: string;
  value?: string;
  renderValue?: (option: Options | undefined) => React.ReactNode;
  renderOption?: (option: Options, isActive: boolean) => React.ReactNode;
  onSelect?: (newValue: string) => void;
  onClose?: () => void;
  getHref?: (value: string) => string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, className = "", onSelect, renderOption, renderValue, onClose, getHref, value }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    if (!renderValue) return;
    const handleTouchOutside = (event: TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("touchstart", handleTouchOutside);
    return () => document.removeEventListener("touchstart", handleTouchOutside);
  }, [onClose, renderValue]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) onClose?.();
  };

  return (
    <div ref={wrapperRef} className={`${styles.dropdownWrapper} ${className}`} onClick={renderValue ? toggleOpen : undefined}>
      {renderValue && renderValue(selectedOption)}
      {(renderValue ? isOpen : true) && options.map((opt) => {
        const isActive = opt.value === value;
        const href = getHref ? getHref(opt.value) : `/${locale}/services/${opt.value}`;
        if (renderOption) {
          const node = renderOption(opt, isActive);
          return (
            <div key={opt.value} className={styles.dropdownOption} onClick={() => { onSelect?.(opt.value); setIsOpen(false); onClose?.(); }}>{node}</div>
          );
        }
        return (
          <Link key={opt.value} href={href} className={styles.dropdownOption} onClick={() => { onSelect?.(opt.value); setIsOpen(false); onClose?.(); }}>
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
};

export default Dropdown;

