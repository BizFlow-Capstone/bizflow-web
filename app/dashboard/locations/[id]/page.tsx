import { Metadata } from "next";
import LocationDetailClient from "./LocationDetailClient";

export const metadata: Metadata = {
  title: "Chi tiết Địa Điểm Kinh Doanh | BizFlow",
  description: "Xem và quản lý sản phẩm tại địa điểm kinh doanh.",
};

/**
 * Location Detail - Server Component
 * Only handles metadata; all data fetching via TanStack Query in Client Component
 */
export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LocationDetailClient locationId={id} />;
}
