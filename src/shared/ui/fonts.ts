import { Montserrat, EB_Garamond, Inter } from "next/font/google";

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "400", "500", "600", "700"],
});

export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
});

