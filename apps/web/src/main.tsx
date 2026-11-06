import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

// 👇 引入全局样式（必须放在 antd reset 之后，或者放在最前面，取决于你想不想覆盖 antd 的默认样式）
import './index.css';
import 'antd/dist/reset.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
