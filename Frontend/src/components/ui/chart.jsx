import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useTheme } from "../theme-provider";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Line Chart Component
export const LineChart = ({ data }) => {
  const { theme } = useTheme();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    setIsDarkTheme(
      theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, [theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: isDarkTheme ? "#e2e8f0" : "#0f172a",
        },
      },
      tooltip: {
        backgroundColor: isDarkTheme ? "#334155" : "#ffffff",
        titleColor: isDarkTheme ? "#e2e8f0" : "#0f172a",
        bodyColor: isDarkTheme ? "#e2e8f0" : "#0f172a",
        borderColor: isDarkTheme ? "#475569" : "#e2e8f0",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: isDarkTheme
            ? "rgba(148, 163, 184, 0.1)"
            : "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: isDarkTheme ? "#cbd5e1" : "#64748b",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkTheme ? "#cbd5e1" : "#64748b",
        },
      },
    },
  };

  return <Line options={options} data={data} />;
};

// Bar Chart Component
export const BarChart = ({ data }) => {
  const { theme } = useTheme();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    setIsDarkTheme(
      theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, [theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: isDarkTheme ? "#e2e8f0" : "#0f172a",
        },
      },
      tooltip: {
        backgroundColor: isDarkTheme ? "#334155" : "#ffffff",
        titleColor: isDarkTheme ? "#e2e8f0" : "#0f172a",
        bodyColor: isDarkTheme ? "#e2e8f0" : "#0f172a",
        borderColor: isDarkTheme ? "#475569" : "#e2e8f0",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: isDarkTheme
            ? "rgba(148, 163, 184, 0.1)"
            : "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: isDarkTheme ? "#cbd5e1" : "#64748b",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkTheme ? "#cbd5e1" : "#64748b",
        },
      },
    },
  };

  return <Bar options={options} data={data} />;
};
