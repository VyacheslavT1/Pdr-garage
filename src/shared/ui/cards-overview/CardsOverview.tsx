"use client";

import React from "react";

interface CardsOverviewProps<ItemType> {
  items: ItemType[];
  renderCardAction: (item: ItemType, index: number) => React.ReactNode;
  className?: string;
}

export default function CardsOverview<ItemType>({
  items,
  renderCardAction,
  className,
}: CardsOverviewProps<ItemType>) {
  return (
    <div className={className}>
      {items.map((item, index) => renderCardAction(item, index))}
    </div>
  );
}
