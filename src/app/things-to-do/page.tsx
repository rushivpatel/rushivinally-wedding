import { getLocations } from "@/data/locations";
import ThingsToDoClient from "./ThingsToDoClient";

export default async function ThingsToDoPage() {
  const locations = await getLocations();
  return <ThingsToDoClient locations={locations} />;
}
