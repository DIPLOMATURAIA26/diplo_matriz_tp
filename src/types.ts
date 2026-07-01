export interface Bank {
  id: string;
  code: string;
  name: string;
  deposits: number; // Max 40
  clients: number;  // Max 120
  audit: number;    // Max 30
  total: number;    // Calculated: deposits + clients + audit
  riskLevel: 'Alto' | 'Medio' | 'Bajo'; // Derived based on score
  depositIndex: number; // e.g. 1, 0.8, 0.4, 0.15
  clientIndex: number;  // e.g. 1, 0.75, 0.1, 0.0375
  auditIndex: number;   // e.g. 1, 0.8, 0.4, 0.15
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
