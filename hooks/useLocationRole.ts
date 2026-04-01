/**
 * useLocationRole
 *
 * Returns whether the currently-selected location is owned by the user
 * (owner = created the location, isOwner === true)
 * or just managed (employee = added by another owner, isOwner === false).
 *
 * All permission-gating in the UI should use this hook.
 */

"use client";

import { useMemo } from "react";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import { useLocations } from "@/hooks/useLocations";

export interface LocationRole {
  /** true = owner of the current location, false = employee */
  isOwner: boolean;
  /** Whether location data is still loading */
  isLoading: boolean;
  /** No location selected / no locations exist */
  hasNoLocation: boolean;
}

export function useLocationRole(): LocationRole {
  const { selectedLocationId } = useDashboardLocation();
  const { data: locations, isLoading } = useLocations();

  return useMemo(() => {
    if (isLoading || !locations) {
      return { isOwner: false, isLoading: true, hasNoLocation: false };
    }

    if (locations.length === 0) {
      return { isOwner: false, isLoading: false, hasNoLocation: true };
    }

    // Find the active location, fall back to first location
    const active =
      locations.find((l) => l.id === selectedLocationId) ?? locations[0];

    return {
      isOwner: active.isOwner === true,
      isLoading: false,
      hasNoLocation: false,
    };
  }, [selectedLocationId, locations, isLoading]);
}
