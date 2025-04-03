import React from 'react';
import { useNavigate } from 'react-router';
import styles from './notFound.module.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className={styles.actions}>
          <button 
            onClick={() => navigate('/')} 
            className={styles.primaryButton}
          >
            Back to Home
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className={styles.secondaryButton}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;