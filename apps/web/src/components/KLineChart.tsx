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
    const values = data.map((item) => [item.open, item.close, item.low, item.high]);
    const volumes = data.map((item) => ({
      value: item.volume,
      itemStyle: {
        color: item.close > item.open ? '#f43f5e' : '#10b981', // 霓虹红 / 翡翠绿
      },
    }));

    // 计算 MA 均线（取前5天为例，简单实现）
    const calculateMA = (dayCount: number) => {
      const result = [];
      for (let i = 0, len = data.length; i < len; i++) {
        if (i < dayCount - 1) {
          result.push('-');
          continue;
        }
        let sum = 0;
        for (let j = 0; j < dayCount; j++) {
          sum += data[i - j].close;
        }
        result.push((sum / dayCount).toFixed(2));
      }
      return result;
    };

    return {
      // 全局透明背景
      backgroundColor: 'transparent',

      title: {
        text: `${stockName} 走势`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 500,
          color: '#ededed', // 浅灰文字
        },
      },

      // 💡 半透明毛玻璃 Tooltip
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#27272a' } },
        backgroundColor: 'rgba(20, 20, 24, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ededed' },
        extraCssText: 'backdrop-filter: blur(10px); box-shadow: 0 8px 30px rgba(0,0,0,0.5);',
      },

      // 💡 图例
      legend: {
        data: ['MA5', 'MA10', 'MA20'],
        top: 30,
        textStyle: { color: '#a1a1aa' },
      },

      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        lineStyle: { color: 'rgba(124, 58, 237, 0.5)', type: 'dashed' }, // 紫色虚线
      },

      grid: [
        { left: '6%', right: '6%', top: '15%', height: '55%' }, // 主图
        { left: '6%', right: '6%', top: '76%', height: '15%' }, // 副图
      ],

      xAxis: [
        {
          type: 'category',
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false, lineStyle: { color: '#3f3f46' } },
          axisLabel: { color: '#71717a' },
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
          axisLine: { onZero: false, lineStyle: { color: '#3f3f46' } },
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
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, // 极弱横线
          axisLabel: { color: '#71717a' },
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

      // 💡 底部缩放滑块（深色主题化）
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 60, end: 100 },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '92%',
          start: 60,
          end: 100,
          borderColor: '#27272a',
          fillerColor: 'rgba(124, 58, 237, 0.15)', // 紫色半透明填充
          handleStyle: { color: '#7c3aed' },
          textStyle: { color: '#71717a' },
          dataBackground: {
            lineStyle: { color: '#3f3f46' },
            areaStyle: { color: '#27272a' },
          },
        },
      ],

      series: [
        {
          name: '日K',
          type: 'candlestick',
          data: values,
          itemStyle: {
            color: '#f43f5e', // 霓虹红（阳线）
            color0: '#10b981', // 翡翠绿（阴线）
            borderColor: '#f43f5e',
            borderColor0: '#10b981',
          },
        },
        // 💡 加入均线，提升专业感
        {
          name: 'MA5',
          type: 'line',
          data: calculateMA(5),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#a78bfa' }, // 浅紫
        },
        {
          name: 'MA10',
          type: 'line',
          data: calculateMA(10),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#fbbf24' }, // 金色
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(20),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#06b6d4' }, // 极光青
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
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#71717a' }}>暂无图表数据</div>
    );
  }

  return <ReactECharts option={option} style={{ height: '600px', width: '100%' }} />;
}
