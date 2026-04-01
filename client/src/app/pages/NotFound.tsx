import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';
import './NotFound.css';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <Result
        status="404"
        title="404"
        subTitle="Извините, страница не найдена"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        }
      />
    </div>
  );
};
