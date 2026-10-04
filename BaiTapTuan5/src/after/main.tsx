import { createRoot } from 'react-dom/client';
import { ProfilerProbe } from '../shared/perf/ProfilerProbe';
import '../shared/styles/app.css';
import App from './App';
createRoot(document.getElementById('root')!).render(<ProfilerProbe id="App"><App /></ProfilerProbe>);
