// app/widgets/Header/Header.tsx
"use client";

import { Link } from "@/i18n/navigation";
import Button from "@/app/shared/ui/Button/Button";
import Dropdown from "@/app/shared/ui/Dropdown/Dropdown";
import { LanguageSwitcher } from "@/app/shared/ui/LanguageSwitcher/LanguageSwitcher";
import { getServiceOptions } from "./serviceOptions";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const serviceOptions = getServiceOptions();
  return (
    <header className="w-full bg-blue-500 shadow-sm">
      <nav className="container mx-auto flex items-center justify-between py-4 px-6">
        <Link href="/" className="text-xl font-semibold">
          PDR Garage
        </Link>
        <ul className="flex space-x-8 items-center">
          <li>
            <LanguageSwitcher />
          </li>
          <li className="relative group">
            <Link href="/#features" className="hover:text-green-500">
              Services
            </Link>
            <Dropdown
              className="hidden group-hover:block absolute top-full left-0"
              options={serviceOptions}
            />
          </li>

          <li>
            <Link href="/#about" className="hover:text-green-500">
              About us
            </Link>
          </li>
          {/* uncomment when store is ready */}
          {/* <li>
            <Link href="/#store" className="hover:text-green-500">
              Store
            </Link>
          </li> */}
          <li>
            <Link href="/#blog" className="hover:text-green-500">
              Blog
            </Link>
          </li>
          <li>
            <Link href="/#contacts" className="hover:text-green-500">
              Contacts
            </Link>
          </li>
          <li>
            <Button variant="primary">Button</Button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
