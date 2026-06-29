'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function TdrCalculator() {
  const [unit, setUnit] = useState<'sqyd' | 'sqft'>('sqyd');
  const [builtupArea, setBuiltupArea] = useState('0');
  const [tdrMarketValue, setTdrMarketValue] = useState('0');
  const [siteMarketValue, setSiteMarketValue] = useState('0');
  const [rows, setRows] = useState<
    {
      builtup: number;
      tdrMv: number;
      siteMv: number;
      tdrArea: number;
    }[]
  >([]);

  const toSqYds = (value: number) => (unit === 'sqft' ? value / 9 : value);
  const fromSqYds = (sqYds: number) => (unit === 'sqft' ? sqYds * 9 : sqYds);

  const builtup = parseFloat(builtupArea) || 0;
  const tdrMv = parseFloat(tdrMarketValue) || 0;
  const siteMv = parseFloat(siteMarketValue) || 0;

  const tdrAreaSqYds = tdrMv > 0 && builtup > 0 ? (toSqYds(builtup) * siteMv) / tdrMv : 0;
  const displayTdrArea = fromSqYds(tdrAreaSqYds);

  function handleCalculate() {
    if (builtup <= 0 || tdrMv <= 0 || siteMv <= 0) return;
    setRows((prev) => [
      ...prev,
      {
        builtup: toSqYds(builtup),
        tdrMv,
        siteMv,
        tdrArea: tdrAreaSqYds,
      },
    ]);
  }

  const totalArea = rows.reduce((sum, row) => sum + row.tdrArea, 0);
  const unitLabel = unit === 'sqyd' ? 'Sq.Yds' : 'Sq.ft';

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <div className="mb-6 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="radio"
              name="unit"
              checked={unit === 'sqyd'}
              onChange={() => setUnit('sqyd')}
              className="accent-[var(--portal-purple)]"
            />
            (In Sq.Yds)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="radio"
              name="unit"
              checked={unit === 'sqft'}
              onChange={() => setUnit('sqft')}
              className="accent-[var(--portal-purple)]"
            />
            (In Sq.ft)
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              id: 'builtup',
              label: `Required Builtup Area (In ${unitLabel})`,
              value: builtupArea,
              set: setBuiltupArea,
            },
            {
              id: 'tdr-mv',
              label: `Market Value of TDR Certificate (In ${unitLabel})`,
              value: tdrMarketValue,
              set: setTdrMarketValue,
            },
            {
              id: 'site-mv',
              label: `Market Value of Receiving Site (In ${unitLabel})`,
              value: siteMarketValue,
              set: setSiteMarketValue,
            },
          ].map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-slate-700">
                {field.label}
                <span className="text-red-600">*</span>
              </label>
              <input
                id={field.id}
                type="number"
                min="0"
                step="any"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--portal-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-purple)]"
              />
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold text-red-600">
          TDR Area to be Purchased (in {unit === 'sqyd' ? 'Sq.yds' : 'Sq.ft'}) :{' '}
          {displayTdrArea.toFixed(2)}
        </p>

        <div className="mt-4">
          <Button
            type="button"
            onClick={handleCalculate}
            className="bg-[var(--portal-blue)] hover:opacity-90"
          >
            Calculate
          </Button>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card padding="none" className="mt-8 overflow-x-auto">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th>SNo</th>
                <th>Required Builtup Area (in Sq.Yds)</th>
                <th>Market Value of TDR Certificate (per Sq.Yd)</th>
                <th>Market Value of Receiving Site (per Sq.Yd)</th>
                <th>TDR Area to be Purchased (in Sq.yds)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.builtup}-${i}`}>
                  <td>{i + 1}</td>
                  <td>{row.builtup.toFixed(2)}</td>
                  <td>{row.tdrMv.toFixed(2)}</td>
                  <td>{row.siteMv.toFixed(2)}</td>
                  <td>{row.tdrArea.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={4} className="text-right">
                  Total Purchase Area
                </td>
                <td colSpan={2}>{totalArea.toFixed(2)} Sq.Yds</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
