"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./Select.module.scss";

export interface SelectProps { label: string; options: string[]; value?: string; onChange: (value: string) => void }

const Select: React.FC<SelectProps> = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.selectField} ref={wrapperRef}>
      <div className={`${styles.inputContainer} ${value ? styles.hasValue : ""}`} onClick={() => setIsOpen(true)}>
        <label className={styles.label}>{label}</label>
        <input className={styles.input} type="text" readOnly placeholder=" " value={value || ""} tabIndex={0} aria-haspopup="listbox"
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setIsOpen((open) => !open); }
            if (event.key === "Escape") setIsOpen(false);
          }} />
      </div>
      {isOpen && (
        <div className={styles.menu} role="listbox">
          {options.map((option) => (
            <div key={option} role="option" aria-selected={value === option} className={styles.option} onClick={() => { onChange(option); setIsOpen(false); }}>
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;
