import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import OperationalDashboard from './OperationalDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OperationalDashboard />
  </StrictMode>,
)
