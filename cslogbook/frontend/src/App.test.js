import { render, screen } from '@testing-library/react';
import App from './App';

test('แสดงหัวข้อระบบ CS Logbook บนหน้าหลัก', async () => {
  render(<App />);
  const titleElement = await screen.findByText(/CS Logbook/i);
  expect(titleElement).toBeInTheDocument();
});
