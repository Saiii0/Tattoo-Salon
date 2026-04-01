import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';
import './Unauthorized.css';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized">
      <Result
        status="error"
        title="401"
        subTitle="Необходимо войти в систему"
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            Перейти к входу
          </Button>
        }
      />
    </div>
  );
};
