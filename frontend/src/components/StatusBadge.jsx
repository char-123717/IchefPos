import './StatusBadge.css';

const statusConfig = {
  paid: { label: 'Paid', emoji: '💰' },
  confirmed: { label: 'Confirmed', emoji: '✅' },
  cooking: { label: 'Cooking', emoji: '🔥' },
  ready: { label: 'Ready', emoji: '✅' },
  done: { label: 'Done', emoji: '🎉' }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, emoji: '❓' };

  return (
    <span className={`status-badge status-${status}`}>
      {config.emoji} {config.label}
    </span>
  );
}
