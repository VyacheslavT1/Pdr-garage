"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UpArrowIcon from "@/shared/Icons/up-arrow.svg";
import styles from "./ScrollToTopButton.module.scss";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const threshold = window.innerHeight * 0.5;
      setIsVisible(scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`${styles.stickyButton} ${isVisible ? styles.visible : ""}`}>
      <Link href="#header-logo" aria-label="Back to top">
        <UpArrowIcon />
      </Link>
    </div>
  );
}
