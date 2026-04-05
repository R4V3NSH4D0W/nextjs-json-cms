"use client";

import { useParams } from "next/navigation";
import { LayoutBuilderPage } from "../layout-builder";

export default function Page() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  return <LayoutBuilderPage mode="edit" layoutId={id} />;
}
