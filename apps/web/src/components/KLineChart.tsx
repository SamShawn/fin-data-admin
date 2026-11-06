import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import { formatNumber, formatDate } from '../utils/format';

export interface KLineData {
  trade_date: string;
  open: number | string;
  close: number | string;
  low: number | string;
  high: number | string;
  volume: number | string;
}

interface KLineChartProps {
  data: KLineData[];
  stockName: string;
}

// ECharts Tooltip 参数简易类型
interface TooltipParam {
  seriesName: string;
  dataIndex: number;
}

export function KLineChart({ data, stockName }: KLineChartProps) {
  const option = useMemo(() => {
    const dates = data.map((item) => formatDate(item.trade_date));

    // 👇 强制转为 Number，防止字符串拼接导致计算错误
    const values = data.map((item) => [
      Number(item.open),
      Number(item.close),
      Number(item.low),
      Number(item.high),
    ]);

    const volumes = data.map((item) => ({
      value: Number(item.volume),
      itemStyle: { color: Number(item.close) > Number(item.open) ? '#f43f5e' : '#10b981' },
    }));

    // 👇 均线计算逻辑强化
    const calculateMA = (dayCount: number) => {
      const result = [];
      for (let i = 0, len = data.length; i < len; i++) {
        if (i < dayCount - 1) {
          result.push('-');
          continue;
        }
        let sum = 0;
        for (let j = 0; j < dayCount; j++) {
          sum += Number(data[i - j].close); // 强制数字相加
        }
        result.push((sum / dayCount).toFixed(2));
      }
      return result;
    };

    return {
      backgroundColor: 'transparent',
      animation: true,

      title: {
        text: `${stockName} 走势`,
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 500, color: '#ededed' },
      },

      // 👇 图例强制选中
      legend: {
        data: ['MA5', 'MA10', 'MA20'],
        top: 30,
        selectedMode: true, // 允许点击隐藏/显示
        textStyle: { color: '#a1a1aa' },
      },

      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#27272a' } },
        backgroundColor: 'rgba(20, 20, 24, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ededed' },
        extraCssText:
          'backdrop-filter: blur(12px); box-shadow: 0 12px 32px rgba(0,0,0,0.6); border-radius: 8px; padding: 12px;',
        // 自定义悬浮窗内容
        formatter: (params: TooltipParam[]) => {
          const candleParam = params.find((p: TooltipParam) => p.seriesName === '日K');
          if (!candleParam) return '';

          const idx = candleParam.dataIndex;
          const item = data[idx];

          // 👇 加一层防御判断
          if (!item || item.open === undefined) return '';

          const prevClose = idx > 0 ? Number(data[idx - 1].close) : Number(item.open);
          const currentClose = Number(item.close);

          const change = currentClose - prevClose;
          const pctChange = (change / prevClose) * 100;
          const color = change > 0 ? '#f43f5e' : change < 0 ? '#10b981' : '#a1a1aa';

          return `
            <div style="font-family: 'Inter', sans-serif; font-size: 12px;">
              <div style="color: #a1a1aa; margin-bottom: 8px; font-weight: bold;">${formatDate(item.trade_date)}</div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 2px 12px 2px 0; color: #a1a1aa;">开盘</td>
                  <td style="text-align: right; font-weight: 500;">${Number(item.open).toFixed(2)}</td>
                  <td style="padding: 2px 12px 2px 12px; color: #a1a1aa;">收盘</td>
                  <td style="text-align: right; font-weight: 500; color: ${color};">${currentClose.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 12px 2px 0; color: #a1a1aa;">最高</td>
                  <td style="text-align: right; font-weight: 500;">${Number(item.high).toFixed(2)}</td>
                  <td style="padding: 2px 12px 2px 12px; color: #a1a1aa;">最低</td>
                  <td style="text-align: right; font-weight: 500;">${Number(item.low).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 12px 2px 0; color: #a1a1aa;">涨跌</td>
                  <td style="text-align: right; font-weight: 500; color: ${color};">${change > 0 ? '+' : ''}${change.toFixed(2)}</td>
                  <td style="padding: 2px 12px 2px 12px; color: #a1a1aa;">幅</td>
                  <td style="text-align: right; font-weight: 500; color: ${color};">${pctChange > 0 ? '+' : ''}${pctChange.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0 2px 0; color: #a1a1aa;">成交量</td>
                  <td colspan="2" style="text-align: right; padding-top: 8px;">${formatNumber(item.volume)}</td>
                </tr>
              </table>
            </div>
          `;
        },
      },

      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        lineStyle: { color: 'rgba(124, 58, 237, 0.5)', type: 'dashed' },
      },

      grid: [
        { left: '4%', right: '4%', top: '15%', height: '55%' },
        { left: '4%', right: '4%', top: '76%', height: '15%' },
      ],

      xAxis: [
        {
          type: 'category',
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false, lineStyle: { color: '#3f3f46' } },
          axisLabel: { color: '#71717a', fontSize: 11 },
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
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
          axisLabel: { color: '#71717a', fontSize: 11 },
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
        // 👇 把默认缩放改为 0 到 100，让刚开始就能看到所有数据
        { type: 'inside', xAxisIndex: [0, 1], start: 0, end: 100 },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '92%',
          start: 0,
          end: 100,
          borderColor: 'transparent',
          fillerColor: 'rgba(124, 58, 237, 0.15)',
          handleStyle: { color: '#7c3aed', borderColor: '#7c3aed' },
          textStyle: { color: '#71717a' },
          dataBackground: {
            lineStyle: { color: '#3f3f46' },
            areaStyle: { color: 'rgba(255,255,255,0.02)' },
          },
        },
      ],
      series: [
        {
          name: '日K',
          type: 'candlestick',
          data: values,
          itemStyle: {
            color: '#f43f5e',
            color0: '#10b981',
            borderColor: '#f43f5e',
            borderColor0: '#10b981',
          },
        },
        // 👇 加粗均线，并加入线条平滑，在深色背景下更明显
        {
          name: 'MA5',
          type: 'line',
          data: calculateMA(5),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#a78bfa', opacity: 0.8 },
        },
        {
          name: 'MA10',
          type: 'line',
          data: calculateMA(10),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#fbbf24', opacity: 0.8 },
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(20),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#06b6d4', opacity: 0.8 },
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
      <div style={{ textAlign: 'center', padding: '80px', color: '#71717a' }}>暂无图表数据</div>
    );
  }

  return <ReactECharts option={option} style={{ height: '100%', minHeight: 500, width: '100%' }} />;
}
