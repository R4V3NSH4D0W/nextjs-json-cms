import { redirect } from "next/navigation";

export default function NewCollectionPage() {
  redirect("/dashboard/cms/collections/builder");
}
