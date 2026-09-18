import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

type ScanPoint = { scanDate: string; count: number };

function formatDay(scanDate: string) {
  const [, month, day] = scanDate.split("-");
  return `${day}/${month}`;
}

export default function ScanChart({
  data,
  height = 220,
}: {
  data: ScanPoint[];
  height?: number;
}) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[#7d8798]"
        style={{ height }}
      >
        Aucun scan enregistré sur cette période.
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="scanFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e5a86b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#e5a86b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="scanDate"
            tickFormatter={formatDay}
            tick={{ fontSize: 11, fill: "#9aa3b1" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <Tooltip
            labelFormatter={label => formatDay(String(label))}
            formatter={(value: number) => [`${value} scan${value === 1 ? "" : "s"}`, ""]}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e6e8ec",
              fontSize: 12,
              boxShadow: "0 8px 24px rgba(23,32,51,0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#c98a4e"
            strokeWidth={2}
            fill="url(#scanFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
