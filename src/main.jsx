import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import OperationalDashboard from './OperationalDashboard.jsx'
import DataScale from './DataScale.jsx'
import OtdDashboard from './OtdDashboard.jsx'

const params = new URLSearchParams(window.location.search);
const Page = params.has('otd') ? OtdDashboard : params.has('scale') ? DataScale : OperationalDashboard;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
