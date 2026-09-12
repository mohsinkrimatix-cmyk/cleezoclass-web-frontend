import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from '../App.jsx';
import GuideProvider from '../components/Guide/GuideProvider';

ReactDOM.render(
  <StrictMode>
    <GuideProvider>
      <App />
    </GuideProvider>
  </StrictMode>,
  document.getElementById('root')
);
