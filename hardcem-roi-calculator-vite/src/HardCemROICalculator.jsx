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

const tieredPricingPerSqFt = (thickness) => {
  if (thickness <= 4) return 0.95;
  if (thickness <= 6) return 0.63;
  return 0.47;
};

const RESURFACING_COST_PER_SQFT = 6;
const CUBIC_FEET_PER_YD = 27;

const getResurfacingInterval = (industry, thickness) => {
  switch (industry) {
    case "manufacturing":
      if (thickness >= 8) return 7;
      return 5;
    case "automotive":
      if (thickness >= 8) return 5;
      return 4;
    case "datacenter":
      return 8;
    case "hydro":
      if (thickness >= 8) return 10;
      return 5;
    default:
      return 5;
  }
};

export default function HardCemROICalculator() {
  const [area, setArea] = useState(50000);
  const [thickness, setThickness] = useState(6);
  const [facilityLife, setFacilityLife] = useState(20);
  const [industry, setIndustry] = useState("manufacturing");
  const [customDowntimeCost, setCustomDowntimeCost] = useState(0);
  const [downtimeHours, setDowntimeHours] = useState(3);
  const [markup, setMarkup] = useState(pricingPresets.readymix);

  const downtimeCost = industry === "custom" ? customDowntimeCost : industryDefaults[industry];
  const unitCostPerSqFt = tieredPricingPerSqFt(thickness) * (1 + markup / 100);
  const hardCemCost = area * unitCostPerSqFt;
  const costPerSqFt = unitCostPerSqFt;
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

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Hard-Cem ROI Calculator</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label>Total Area (sq.ft)</Label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label>Slab Thickness (inches)</Label>
            <Input
              type="number"
              value={thickness}
              onChange={(e) => setThickness(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label>Facility Operational Life (years)</Label>
            <Input
              type="number"
              value={facilityLife}
              onChange={(e) => setFacilityLife(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label>Select Industry</Label>
            <Select
              value={industry}
              onValueChange={(val) => setIndustry(val)}
            >
              <SelectTrigger>{industry}</SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturing">Manufacturing ($260K/hr)</SelectItem>
                <SelectItem value="automotive">Automotive ($3M/hr)</SelectItem>
                <SelectItem value="datacenter">Data Center ($600K/hr)</SelectItem>
                <SelectItem value="hydro">Hydroelectric ($20K/hr)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {industry === "custom" && (
            <div>
              <Label>Custom Downtime Cost per Hour ($)</Label>
              <Input
                type="number"
                value={customDowntimeCost}
                onChange={(e) => setCustomDowntimeCost(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
          <div>
            <Label>Expected Downtime (hours per resurfacing)</Label>
            <Input
              type="number"
              value={downtimeHours}
              onChange={(e) => setDowntimeHours(parseFloat(e.target.value))}
            />
            <div className="text-sm text-muted-foreground">Set to 0 if you want to model a no-incident case. The expected downtime field estimates potential incident-related operational losses that would require concrete repair.</div>
          </div>
          <div>
            <Label>Hard-Cem Markup (%): Select Profile</Label>
            <Select
              value={String(markup)}
              onValueChange={(val) => setMarkup(Number(val))}
            >
              <SelectTrigger>{markup}%</SelectTrigger>
              <SelectContent>
                <SelectItem value={String(pricingPresets.distributor)}>Distributor ({pricingPresets.distributor}%)</SelectItem>
                <SelectItem value={String(pricingPresets.readymix)}>Ready-Mix ({pricingPresets.readymix}%)</SelectItem>
                <SelectItem value={String(pricingPresets.enduser)}>End Customer ({pricingPresets.enduser}%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div><strong>Total Hard-Cem Investment:</strong> ${hardCemCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-sm text-muted-foreground">Tiered unit pricing ($/ft²) by thickness × area × markup. Reflects market-aligned costing logic.</div>

          <div><strong>Cost per sq.ft:</strong> ${costPerSqFt.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">From tiered base rate of ${tieredPricingPerSqFt(thickness).toFixed(2)} + markup profile ({markup}%).</div>

          <div><strong>Potential Downtime Loss (per event):</strong> ${downtimeLoss.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Hourly downtime × hours per resurfacing. Reflects per-cycle operational risk.</div>

          <div><strong>Estimated ROI:</strong> {downtimeHours === 0 ? "n/a (no incidents)" : `${roi.toFixed(2)}x`}</div>
          <div className="text-sm text-muted-foreground">ROI = downtime loss ÷ Hard-Cem cost. If downtime = 0, this estimate focuses only on resurfacing cost savings.</div>

          <div><strong>Resurfacing Interval Without Hard-Cem:</strong> Every {resurfacingInterval} years</div>
          <div className="text-sm text-muted-foreground">Interval logic by industry and slab thickness. Reflects expected wear cycles for traditional floors.</div>

          <div><strong>Total Resurfacing Cost over Facility Life:</strong> ${totalResurfacingCost.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Resurfacing cost = $6/sq.ft × {numberOfResurfacings} events.</div>

          <div><strong>Total Downtime Cost from Resurfacing:</strong> ${totalDowntimeCost.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Downtime cost is only included if expected downtime &gt; 0.</div>

          <div><strong>Lifetime Savings with Hard-Cem:</strong> ${lifetimeSavings.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Savings = resurfacing + downtime cost avoided – Hard-Cem investment. Full lifecycle economics over {facilityLife} years.</div>

          <div><strong>Annualized Savings:</strong> ${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} / year</div>
          <div className="text-sm text-muted-foreground">Average yearly savings by eliminating risk and maintenance cost burden.</div>
        </CardContent>
      </Card>
    </div>
  );
}
