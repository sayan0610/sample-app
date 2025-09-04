import { useState } from 'react';
import Modal from './Modal.jsx';

export default function CompleteTaskModal({ task, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');

  if (!task) return null;

  function submit(e) {
    e.preventDefault();
    if (!reason.trim()) return setError('Reason required');
    if (!signature.trim()) return setError('Signature required');
    setError('');
    onConfirm({ reason: reason.trim(), signature: signature.trim() });
  }

  return (
    <Modal title="Complete Task" onClose={onCancel}>
      <form className="m-form" onSubmit={submit}>
        <div className="m-field">
          <label>Reason</label>
          <textarea
            rows={5}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why is this task complete?"
            required
          />
        </div>
        <div className="m-field">
          <label>Signature</label>
          <input
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder="Your name / initials"
            required
          />
        </div>
        {error && <div className="m-error">{error}</div>}
        <div className="m-footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary">Confirm</button>
        </div>
      </form>
    </Modal>
  );
}