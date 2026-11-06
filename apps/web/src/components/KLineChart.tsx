import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

export interface KLineData {
  trade_date: string;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
}

interface KLineChartProps {
  data: KLineData[];
  stockName: string;
}

export function KLineChart({ data, stockName }: KLineChartProps) {
  const option = useMemo(() => {
    const dates = data.map((item) => item.trade_date);
    // ECharts 蜡烛图数据格式：[open, close, low, high]
    const values = data.map((item) => [item.open, item.close, item.low, item.high]);
    const volumes = data.map((item) => ({
      value: item.volume,
      itemStyle: {
        color: item.close > item.open ? '#ef232a' : '#14b143', // 涨红跌绿
      },
    }));

    return {
      title: {
        text: `${stockName} 历史走势`,
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }], // 主副图联动
      },
      grid: [
        { left: '10%', right: '8%', top: '10%', height: '55%' }, // 主图
        { left: '10%', right: '8%', top: '75%', height: '15%' }, // 副图
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: { show: true },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 60, end: 100 },
        { show: true, xAxisIndex: [0, 1], type: 'slider', top: '92%', start: 60, end: 100 },
      ],
      series: [
        {
          name: '日K',
          type: 'candlestick',
          data: values,
          itemStyle: {
            color: '#ef232a',
            color0: '#14b143',
            borderColor: '#ef232a',
            borderColor0: '#14b143',
          },
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes,
        },
      ],
    };
  }, [data, stockName]);

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>暂无图表数据</div>;
  }

  return <ReactECharts option={option} style={{ height: '500px', width: '100%' }} />;
}
