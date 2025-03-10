import { useEffect, useState } from "react";

const TradingViewChart = () => {

  const [chartHeight, setChartHeight] = useState(400);


  const assignChartHeight = () => {
    const chartSection = document.getElementById('chartSection');
    if (chartSection) {
      setChartHeight(chartSection.clientHeight);
    }
  }

  useEffect(() => {
    assignChartHeight();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', assignChartHeight);
    return () => {
      window.removeEventListener('resize', assignChartHeight);
    };
  }, []);

  return <div id="tv_chart" style={{ position: "relative", width: "100%", height: `${chartHeight}px` }} />;
};

export default TradingViewChart;
