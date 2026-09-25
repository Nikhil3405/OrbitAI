"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = [
  "#2563EB",
  "#0D9488",
  "#EA580C",
  "#737373",
  "#111111",
];

export default function AnalysisChart({ chart }) {
  if (!chart?.data?.length) {
    return null;
  }

  const data = chart.data;

  const xKey = resolveDataKey(
    chart.x_axis,
    data
  );

  const yKey = resolveDataKey(
    chart.y_axis,
    data
  );

  if (!xKey || !yKey) {
    console.error("Unable to resolve chart keys:", {
      x_axis: chart.x_axis,
      y_axis: chart.y_axis,
      firstRow: data[0],
    });

    return (
      <div className="flex h-90 items-center justify-center text-sm text-neutral-500">
        Unable to render chart data.
      </div>
    );
  }

  console.log("Chart keys:", {
    xKey,
    yKey,
    data,
  });

  return (
    <div className="h-90 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart(
          chart.type,
          data,
          xKey,
          yKey
        )}
      </ResponsiveContainer>
    </div>
  );
}

function resolveDataKey(label, data) {
  if (!label || !data?.length) {
    return null;
  }

  const firstRow = data[0];

  const keys = Object.keys(firstRow);

  // Exact match
  if (keys.includes(label)) {
    return label;
  }

  // snake_case match
  const snakeCase = label
    .trim()
    .replace(/\s+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase();

  if (keys.includes(snakeCase)) {
    return snakeCase;
  }

  // Case-insensitive match
  const lowerLabel = label.toLowerCase();

  const caseInsensitiveMatch = keys.find(
    (key) => key.toLowerCase() === lowerLabel
  );

  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  // Normalized comparison
  // "Total Quantity" -> "totalquantity"
  // "total_quantity" -> "totalquantity"
  const normalizedLabel = normalizeKey(label);

  const normalizedMatch = keys.find(
    (key) => normalizeKey(key) === normalizedLabel
  );

  if (normalizedMatch) {
    return normalizedMatch;
  }

  return null;
}

function normalizeKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function renderChart(
  type,
  data,
  xKey,
  yKey
) {
  switch (type) {
    case "line":
      return (
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      );

    case "pie":
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={110}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  PIE_COLORS[
                    index % PIE_COLORS.length
                  ]
                }
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      );

    case "bar":
    default:
      return (
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip />

          <Bar
            dataKey={yKey}
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      );
  }
}