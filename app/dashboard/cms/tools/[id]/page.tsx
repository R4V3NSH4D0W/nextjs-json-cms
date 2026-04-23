"use client";

import { useParams } from "next/navigation";
import { CmsToolBuilder } from "../tool-builder";

export default function EditCmsToolPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <CmsToolBuilder toolId={id} />;
}
