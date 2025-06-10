import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const industryDefaults = {
  manufacturing: 260000,
  automotive: 3000000,
  datacenter: 600000,
  hydro: 20000,
  custom: 0
};

const pricingPresets = {
  distributor: 15,
  readymix: 25,
  enduser: 40
};

const RESURFACING_COST_PER_SQFT = 6;
const BASE_COST_PER_LB = 0.32;
const DEFAULT_LBS_PER_YD3 = 66;
const CUBIC_FEET_PER_YD3 = 27;
const FREIGHT_RATES_CAD = {
  "Toronto": 3800,
  "Vancouver": 1550,
  "Montreal": 4200,
  "Edmonton": 1000,
  "Winnipeg": 1800,
  "Seattle": 2432.43,
  "New York": 7297.3,
  "Chicago": 4594.59,
  "Dallas": 4594.59
};

const getResurfacingInterval = (industry, thickness) => {
  switch (industry) {
    case "manufacturing": return thickness >= 8 ? 7 : 5;
    case "automotive": return thickness >= 8 ? 5 : 4;
    case "datacenter": return 8;
    case "hydro": return thickness >= 8 ? 10 : 5;
    default: return 5;
  }
};

function normalizeCity(input) {
  return input.trim().toLowerCase();
}

export default function HardCemROICalculator() {
  const [area, setArea] = useState(50000);
  const [thickness, setThickness] = useState(6);
  const [facilityLife, setFacilityLife] = useState(20);
  const [industry, setIndustry] = useState("manufacturing");
  const [customDowntimeCost, setCustomDowntimeCost] = useState(0);
  const [downtimeHours, setDowntimeHours] = useState(3);
  const [markup, setMarkup] = useState(pricingPresets.readymix);
  const [dosagePct, setDosagePct] = useState(100);
  const [deliveryCity, setDeliveryCity] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const FX_RATE = 0.73; // Example static rate for CAD to USD

  const downtimeCost = industry === "custom" ? customDowntimeCost : industryDefaults[industry];
  const thicknessInFeet = thickness / 12;
  const volumeCubicFeet = area * thicknessInFeet;
  const volumeCubicYards = volumeCubicFeet / CUBIC_FEET_PER_YD3;

  const adjustedLbsPerYd3 = DEFAULT_LBS_PER_YD3 * (dosagePct / 100);
  const rawCostPerYd3 = adjustedLbsPerYd3 * BASE_COST_PER_LB;
  const markedUpCostPerYd3 = rawCostPerYd3 * (1 + markup / 100);
  const hardCemCost = volumeCubicYards * markedUpCostPerYd3;
  const costPerSqFt = hardCemCost / area;

  const downtimeLoss = downtimeCost * downtimeHours;
  const roi = downtimeHours === 0 ? 0 : downtimeLoss / hardCemCost;

  const resurfacingInterval = getResurfacingInterval(industry, thickness);
  const numberOfResurfacings = Math.floor(facilityLife / resurfacingInterval);
  const resurfacingCostPerCycle = area * RESURFACING_COST_PER_SQFT;
  const totalResurfacingCost = numberOfResurfacings * resurfacingCostPerCycle;
  const totalDowntimeCost = numberOfResurfacings * downtimeLoss;
  const totalCostWithoutHardCem = totalResurfacingCost + totalDowntimeCost;
  const lifetimeSavings = totalCostWithoutHardCem - hardCemCost;
  const annualSavings = lifetimeSavings / facilityLife;

  const normalizedCity = normalizeCity(deliveryCity);
  const matchedCity = Object.keys(FREIGHT_RATES_CAD).find(
    c => normalizeCity(c) === normalizedCity
  );
  const freightPerTruck = matchedCity ? FREIGHT_RATES_CAD[matchedCity] : 4500;
  const totalMaterialWeightKg = volumeCubicYards * adjustedLbsPerYd3 * 0.4536;
  const numPallets = totalMaterialWeightKg / 1200;
  const freightCost = (freightPerTruck / 16) * numPallets;
  const totalInvestment = hardCemCost + freightCost;

  const convert = (val) => currency === "USD" ? val * FX_RATE : val;
  const format = (val) => `${currency === "USD" ? "$" : "C$"}${convert(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const formatFloat = (val) => `${currency === "USD" ? "$" : "C$"}${convert(val).toFixed(2)}`;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Hard-Cem ROI Calculator</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label>Currency</Label>
            <p className="text-sm text-muted-foreground">Toggle between CAD and USD to see costs in preferred currency. USD uses static FX rate.</p>
            <Select value={currency} onValueChange={val => setCurrency(val)}>
              <SelectTrigger>{currency}</SelectTrigger>
              <SelectContent>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Total Area (sq.ft)</Label>
            <p className="text-sm text-muted-foreground">The total floor area of the concrete slab in square feet. Affects total material volume and cost.</p>
            <Input type="number" value={area} onChange={(e) => setArea(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Slab Thickness (inches)</Label>
            <p className="text-sm text-muted-foreground">Thickness of the concrete slab. Used to calculate volume and impacts wear/resurfacing logic.</p>
            <Input type="number" value={thickness} onChange={(e) => setThickness(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Facility Operational Life (years)</Label>
            <p className="text-sm text-muted-foreground">The planned operational lifespan of the facility. Determines how many resurfacing cycles are expected.</p>
            <Input type="number" value={facilityLife} onChange={(e) => setFacilityLife(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Dosage Rate (% of standard 2 bags/yd³)</Label>
            <p className="text-sm text-muted-foreground">Adjusts the Hard-Cem dosage by percentage. Affects price per yard based on lb/yd³ used.</p>
            <Slider min={50} max={125} step={5} value={[dosagePct]} onValueChange={([v]) => setDosagePct(v)} />
            <div className="text-sm text-muted-foreground">Current Dosage: {dosagePct}%</div>
          </div>
          <div>
            <Label>Select Industry</Label>
            <p className="text-sm text-muted-foreground">Industry type affects expected downtime cost and resurfacing intervals.</p>
            <Select value={industry} onValueChange={(val) => setIndustry(val)}>
              <SelectTrigger>{industry}</SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="datacenter">Data Center</SelectItem>
                <SelectItem value="hydro">Hydroelectric</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {industry === "custom" && (
            <div>
              <Label>Custom Downtime Cost per Hour ($)</Label>
              <p className="text-sm text-muted-foreground">Define your own estimated loss per hour of facility downtime.</p>
              <Input type="number" value={customDowntimeCost} onChange={(e) => setCustomDowntimeCost(parseFloat(e.target.value))} />
            </div>
          )}
          <div>
            <Label>Expected Downtime (hours per resurfacing)</Label>
            <p className="text-sm text-muted-foreground">How long the facility must shut down for a typical floor repair cycle.</p>
            <Input type="number" value={downtimeHours} onChange={(e) => setDowntimeHours(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Markup Profile (%)</Label>
            <p className="text-sm text-muted-foreground">Choose markup based on your business profile: distributor, ready-mix, or end user.</p>
            <Select value={String(markup)} onValueChange={(val) => setMarkup(Number(val))}>
              <SelectTrigger>{markup}%</SelectTrigger>
              <SelectContent>
                <SelectItem value={String(pricingPresets.distributor)}>Distributor ({pricingPresets.distributor}%)</SelectItem>
                <SelectItem value={String(pricingPresets.readymix)}>Ready-Mix ({pricingPresets.readymix}%)</SelectItem>
                <SelectItem value={String(pricingPresets.enduser)}>End Customer ({pricingPresets.enduser}%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Delivery City</Label>
            <p className="text-sm text-muted-foreground">Enter destination city for delivery. Freight cost is based on truck rates from Calgary to your city.</p>
            <Input type="text" value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div><strong>Total Hard-Cem Investment:</strong> {format(totalInvestment)}</div>
          <div><strong>Cost per sq.ft:</strong> {formatFloat(costPerSqFt)}</div>
          <div><strong>Freight Cost Estimate:</strong> {format(freightCost)} (to {matchedCity || deliveryCity || "unknown city"})</div>
          <div><strong>Downtime Loss (per event):</strong> {format(downtimeLoss)}</div>
          <div><strong>Estimated ROI:</strong> {downtimeHours === 0 ? "n/a (no incidents)" : `${roi.toFixed(2)}x`}</div>
          <div><strong>Total Resurfacing Cost:</strong> {format(totalResurfacingCost)}</div>
          <div><strong>Total Downtime Cost:</strong> {format(totalDowntimeCost)}</div>
          <div><strong>Lifetime Savings:</strong> {format(lifetimeSavings)}</div>
          <div><strong>Annual Savings:</strong> {format(annualSavings)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
