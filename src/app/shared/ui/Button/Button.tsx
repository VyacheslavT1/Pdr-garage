// app/shared/ui/Button/Button.tsx

import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary" | "toggle";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant,
  icon,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = [
    "inline-flex",
    "items-center",
    "justify-center",
    "gap-2",
    "px-5",
    "py-2.5",
    "rounded-lg",
    "focus:outline-none",
    "cursor-pointer",
    "transition-colors",
    "filter",
  ].join(" ");

  const variantClasses: Record<ButtonProps["variant"], string> = {
    primary: [
      "bg-[#00ae1c]",
      "text-[#fff]",
      "disabled:opacity-60",
      "disabled:cursor-not-allowed",
      "hover:outline",
      "hover:outline-[#5ce171]",
      "active:bg-[#0cd52b]",
    ].join(" "),

    secondary: [
      "border",
      "border-[#dedfe5]",
      "bg-[#fff]",
      "text-[#323749]",
      "disabled:border-[#8d8e91]",
      "disabled:bg-[#c8c8c8]",
      "disabled:text-[#737373]",
      "disabled:cursor-not-allowed",
      "hover:bg-[#efefef]",
      "hover:shadow-[0_5px_10px_-3px_#dedfe5]",
      "active:bg-[#e0e0e0]",
    ].join(" "),

    toggle: [
      "p-2",
      "rounded-full",
      "bg-transparent",
      "text-[var(--color-dark)]",
      "hover:bg-[var(--color-grey-30)]",
      "hover:shadow-[0_1px_2px_rgba(69,69,69,0.25)]",
    ].join(" "),
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
}
