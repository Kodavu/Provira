import { Controller, Get, Query } from "@nestjs/common";
import { NIGERIA_GEO } from "./geo.data.js";

// State → LGA → Ward lookups, powering the cascading location selects on the
// worker profile and the job posting form. Names only; matching is by name so
// workers and employers who pick from the same lists line up exactly.
@Controller("geo")
export class GeoController {
  private readonly stateNames = NIGERIA_GEO.map((s) => s.state).sort((a, b) => a.localeCompare(b));

  @Get("states")
  states() {
    return this.stateNames;
  }

  @Get("lgas")
  lgas(@Query("state") state?: string) {
    if (!state) return [];
    const s = NIGERIA_GEO.find((x) => x.state.toLowerCase() === state.trim().toLowerCase());
    return s ? s.lgas.map((l) => l.name).sort((a, b) => a.localeCompare(b)) : [];
  }

  @Get("wards")
  wards(@Query("state") state?: string, @Query("lga") lga?: string) {
    if (!state || !lga) return [];
    const s = NIGERIA_GEO.find((x) => x.state.toLowerCase() === state.trim().toLowerCase());
    const l = s?.lgas.find((x) => x.name.toLowerCase() === lga.trim().toLowerCase());
    return l ? [...l.wards].sort((a, b) => a.localeCompare(b)) : [];
  }
}
