import { Metadata } from "next";
import LocationsClient from "./LocationsClient";

// SEO Metadata - Server Component handles static metadata only
export const metadata: Metadata = {
  title: "Quản lý Địa Điểm Kinh Doanh | BizFlow",
  description:
    "Quản lý trạng thái và thông tin các điểm kinh doanh của bạn. Xem, tạo mới và cập nhật địa điểm kinh doanh.",
  openGraph: {
    title: "Quản lý Địa Điểm Kinh Doanh | BizFlow",
    description: "Quản lý trạng thái và thông tin các điểm kinh doanh của bạn.",
  },
};

/**
 * Server Component - Layout shell only
 *
 * ⚠️ IMPORTANT: For CRUD dashboards, do NOT use:
 * - ISR (revalidate)
 * - Server Component data fetching with cache
 *
 * These cause stale data issues. Instead:
 * - Use TanStack Query in Client Components
 * - Data fetching handled by LocationsClient via useLocations hook
 */
export default function LocationsPage() {
  return <LocationsClient />;
}
