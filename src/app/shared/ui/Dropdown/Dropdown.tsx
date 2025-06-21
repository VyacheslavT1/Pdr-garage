interface Options {
  value: string;
  label: string;
}

export interface DropdownProps {
  options: Options[];
  icon?: React.ReactNode;
  className?: string;
  value?: string;
  renderValue?: (option: Options | undefined) => React.ReactNode;
  renderOption?: (option: Options, isActive: boolean) => React.ReactNode;
  onSelect?: (newValue: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  className = "",
  onSelect,
  renderOption,
  value,
}) => {
  return (
    <div
      className={`w-max bg-gray-500 rounded-lg shadow-lg overflow-hidden z-10 ${className}`}
    >
      {options.map((opt) => (
        <div
          key={opt.value}
          onClick={() => onSelect?.(opt.value)}
          className="px-4 py-1 hover:bg-gray-100"
        >
          {renderOption ? renderOption(opt, opt.value === value) : opt.label}
        </div>
      ))}
    </div>
  );
};

export default Dropdown;
