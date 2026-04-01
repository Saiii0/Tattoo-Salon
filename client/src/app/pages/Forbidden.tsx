import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';
import './Forbidden.css';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="forbidden">
      <Result
        status="403"
        title="403"
        subTitle="Доступ запрещён"
        extra={
          <Button type="primary" onClick={() => navigate('/')}
          >
            На главную
          </Button>
        }
      />
    </div>
  );
};
