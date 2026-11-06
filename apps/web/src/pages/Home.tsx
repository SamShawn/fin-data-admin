import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Card, Row, Col, Statistic } from 'antd';

export default function HomePage() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>今日大盘概览</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="上证指数 (000001.SH)"
              value={3050.23}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowUpOutlined />}
              suffix="+1.25%"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="深证成指 (399001.SZ)"
              value={9800.12}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowDownOutlined />}
              suffix="-0.85%"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="创业板指 (399006.SZ)"
              value={1920.45}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowUpOutlined />}
              suffix="+2.10%"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
