import React from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';

export default function StatusBadge({ status }) {
  return (
    <span className={STATUS_COLORS[status] || 'badge bg-gray-100 text-gray-700'}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
