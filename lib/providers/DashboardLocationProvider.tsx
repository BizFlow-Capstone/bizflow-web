"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type DashboardLocationContextValue = {
  selectedLocationId: number | null;
  setSelectedLocationId: (locationId: number | null) => void;
  switchLocation: (locationId: number) => void;
  isSwitchingLocation: boolean;
};

const STORAGE_KEY = "dashboard:selected-location-id";

const DashboardLocationContext =
  createContext<DashboardLocationContextValue | null>(null);

export function DashboardLocationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLocationId, setSelectedLocationIdState] = useState<
    number | null
  >(() => {
    if (typeof window === "undefined") return null;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });
  const [isSwitchingLocation, setIsSwitchingLocation] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (selectedLocationId && selectedLocationId > 0) {
      window.localStorage.setItem(STORAGE_KEY, String(selectedLocationId));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [selectedLocationId]);

  const setSelectedLocationId = useCallback((locationId: number | null) => {
    setSelectedLocationIdState(locationId);
  }, []);

  const switchLocation = useCallback(
    (locationId: number) => {
      if (!locationId || locationId <= 0) return;

      setIsSwitchingLocation(true);
      setSelectedLocationIdState(locationId);
      router.push("/dashboard");
    },
    [router],
  );

  useEffect(() => {
    if (!isSwitchingLocation) return;
    if (pathname !== "/dashboard") return;

    const timer = window.setTimeout(() => {
      setIsSwitchingLocation(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [isSwitchingLocation, pathname, selectedLocationId]);

  const value = useMemo(
    () => ({
      selectedLocationId,
      setSelectedLocationId,
      switchLocation,
      isSwitchingLocation,
    }),
    [
      selectedLocationId,
      setSelectedLocationId,
      switchLocation,
      isSwitchingLocation,
    ],
  );

  return (
    <DashboardLocationContext.Provider value={value}>
      {children}
      {isSwitchingLocation && (
        <div className="fixed inset-0 z-90 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-6 py-5 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#23C4C1]" />
            <p className="text-sm font-medium text-gray-700">
              Đang chuyển địa điểm...
            </p>
          </div>
        </div>
      )}
    </DashboardLocationContext.Provider>
  );
}

export function useDashboardLocation() {
  const context = useContext(DashboardLocationContext);
  if (!context) {
    throw new Error(
      "useDashboardLocation must be used within DashboardLocationProvider",
    );
  }
  return context;
}
