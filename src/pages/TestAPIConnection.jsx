import { useState } from 'react';
import { Card, Button, Space, Alert, Spin, Typography, Divider, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, ApiOutlined } from '@ant-design/icons';
import { authAPI, stationsAPI, healthAPI } from '../services/api.real';

const { Title, Text, Paragraph } = Typography;

/**
 * Component để test kết nối Frontend - Backend
 * Giúp verify rằng React app đang kết nối đúng với ASP.NET Core API
 */
const TestAPIConnection = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, status, message, data = null) => {
    setResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setResults([]);
    setLoading(true);

    try {
      // Test 1: Health Check
      addResult('Health Check', 'loading', 'Checking backend health...');
      try {
        const health = await healthAPI.check();
        addResult('Health Check', 'success', `Backend is healthy: ${health.data}`, health);
      } catch (error) {
        addResult('Health Check', 'error', `Failed: ${error.message}`);
      }

      // Test 2: Get All Stations
      addResult('GET Stations', 'loading', 'Fetching all stations...');
      try {
        const stations = await stationsAPI.getAll();
        addResult('GET Stations', 'success', `Retrieved ${stations.length || 0} stations`, stations.slice(0, 3));
      } catch (error) {
        addResult('GET Stations', 'error', `Failed: ${error.message}`);
      }

      // Test 3: Get Single Station
      addResult('GET Station by ID', 'loading', 'Fetching station ID 1...');
      try {
        const station = await stationsAPI.getById(1);
        addResult('GET Station by ID', 'success', `Retrieved: ${station.name}`, station);
      } catch (error) {
        addResult('GET Station by ID', 'error', `Failed: ${error.message}`);
      }

      // Test 4: Test Auth (Invalid Login - Should Fail)
      addResult('Auth Test', 'loading', 'Testing auth endpoint with invalid credentials...');
      try {
        await authAPI.login({ email: 'test@invalid.com', password: 'wrong' });
        addResult('Auth Test', 'warning', 'Login succeeded (unexpected)');
      } catch (error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          addResult('Auth Test', 'success', 'Auth endpoint working correctly (rejected invalid login)');
        } else {
          addResult('Auth Test', 'error', `Unexpected error: ${error.message}`);
        }
      }

      // Test 5: Search Stations
      addResult('Search Test', 'loading', 'Testing station search...');
      try {
        const searchResults = await stationsAPI.search('station');
        addResult('Search Test', 'success', `Search returned ${searchResults.length || 0} results`, searchResults.slice(0, 2));
      } catch (error) {
        addResult('Search Test', 'error', `Failed: ${error.message}`);
      }

    } catch (error) {
      addResult('Test Suite', 'error', `Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      case 'loading':
        return <LoadingOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
      case 'warning':
        return <ApiOutlined style={{ color: '#faad14', fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'loading': return 'processing';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalTests = results.filter(r => r.status !== 'loading').length;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>
          <ApiOutlined /> Frontend-Backend Integration Test
        </Title>
        <Paragraph>
          Test kết nối giữa React Frontend (port 5173/5174) và ASP.NET Core Backend (port 5000).
        </Paragraph>

        <Alert
          message="Backend URL"
          description={
            <div>
              <Text strong>Base URL:</Text> <Text code>http://localhost:5000/api</Text>
              <br />
              <Text strong>Swagger:</Text> <Text code>http://localhost:5000/swagger</Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Space>
          <Button
            type="primary"
            size="large"
            onClick={runTests}
            loading={loading}
            icon={<ApiOutlined />}
          >
            Run Tests
          </Button>
        </Space>

        {results.length > 0 && (
          <>
            <Divider />
            
            {totalTests > 0 && (
              <Alert
                message={`Test Results: ${successCount}/${totalTests} passed`}
                type={errorCount === 0 ? 'success' : 'warning'}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {results.map((result, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    borderLeft: `4px solid ${
                      result.status === 'success' ? '#52c41a' :
                      result.status === 'error' ? '#ff4d4f' :
                      result.status === 'loading' ? '#1890ff' : '#faad14'
                    }`
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      {getStatusIcon(result.status)}
                      <Text strong>{result.test}</Text>
                      <Tag color={getStatusColor(result.status)}>
                        {result.status.toUpperCase()}
                      </Tag>
                      <Text type="secondary">{result.timestamp}</Text>
                    </Space>
                    
                    <Text>{result.message}</Text>
                    
                    {result.data && (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                          View Response Data
                        </summary>
                        <pre style={{
                          background: '#f5f5f5',
                          padding: 12,
                          borderRadius: 4,
                          overflow: 'auto',
                          maxHeight: 300
                        }}>
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default TestAPIConnection;
