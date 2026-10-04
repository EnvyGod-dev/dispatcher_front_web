"use client";

import { useMemo } from "react";
import CountryMap from "./CountryMap";
import { FleetMetricsProps } from "../dashboard/FleetDashboard";

export const DemographicCard: React.FC<FleetMetricsProps> = ({ data, isLoading }) => {
  const markers = useMemo(() => {
    if (!data?.miningDemographics?.length) return [];

    return data.miningDemographics
      .filter(
        (md) =>
          md.latitude &&
          md.longitude &&
          !isNaN(Number(md.latitude)) &&
          !isNaN(Number(md.longitude))
      )
      .map((md) => ({
        latLng: [Number(md.latitude), Number(md.longitude)] as [number, number],
        name: md.name || md.code || "Unknown site",
        style: {
          fill: "#465FFF",
          borderWidth: 1,
          borderColor: "white",
        },
      }));
  }, [data]);

  const demographics = useMemo(() => {
    if (!data?.miningDemographics?.length) return [];

    const totalWorkCount = data.miningDemographics.reduce(
      (sum, md) => sum + (Number(md.workCount) || 0),
      0
    );

    return data.miningDemographics.map((md) => {
      const percent = totalWorkCount
        ? Math.round(((Number(md.workCount) || 0) / totalWorkCount) * 100)
        : 0;

      return {
        id: md.id,
        name: md.name || "Unknown",
        country: md.materialName || "N/A",
        customers: `${md.totalTonnage || 0} тонн`,
        percent,
      };
    });
  }, [data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Газар зүйн байршлаар харах
          </h3>
        </div>
      </div>

      <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          {!isLoading && markers.length > 0 ? (
            <CountryMap markers={markers} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              {isLoading ? "Loading map..." : "No data available"}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {demographics.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                  {item.name}
                </p>
                <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                  {item.customers}
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[140px] items-center gap-3">
              <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                <div
                  className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {item.percent}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
