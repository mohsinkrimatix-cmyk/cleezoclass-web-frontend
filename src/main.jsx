import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import GuideProvider from './components/Guide/GuideProvider';

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <StrictMode>
    <GuideProvider>
      <App />
    </GuideProvider>
  </StrictMode>,
  
);
