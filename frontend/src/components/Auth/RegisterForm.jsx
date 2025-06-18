import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/RegisterForm.css';

const RegisterForm = () => {
  const navigate = useNavigate();
  return (
    <div className="login-container">
      {/* Header */}
      <header className="login-header">
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262Z" />
            </svg>
          </div>
          <div className="logo-text">ChatApp</div>
        </div>
       
        <button 
        onClick={() => navigate('/login')}
        className="header-login-btn">Log In</button>
      </header>

      {/* Form */}
      <main className="form-wrapper">
        <div className="login-box">
          <h2>Create your account</h2>
          <input type="email" placeholder="Email address" />
          <input type="password" placeholder="Password" />
          <input type="text" placeholder="Full name" />
          <input type="text" placeholder="Username" />
          <button className="submit-btn">Create account</button>
          <p className="signup-link">
            By signing up, you agree to our <a href="#">Terms</a>, <a href="#">Privacy Policy</a> and <a href="#">Cookie Use</a>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterForm;
