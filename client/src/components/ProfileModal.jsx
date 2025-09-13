import { useState, useEffect, useRef } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

// Simple local-only profile edit (demo). Stores extended fields in auth_users entry.
export default function ProfileModal({ open, onClose }) {
  const { user, updateProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(''); // may be URL or data URI
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    processImageFile(file, setPhoto, setFileInfo);
  }

  function handleDrop(e) {
    e.preventDefault();
    if (dropRef.current) dropRef.current.style.borderColor = '#cbd5e1';
    const file = e.dataTransfer.files?.[0];
    processImageFile(file, setPhoto, setFileInfo);
  }

  useEffect(() => {
    if (open && user) {
      try {
        const users = JSON.parse(localStorage.getItem('auth_users')||'[]');
        const found = users.find(u => u.username.toLowerCase() === user.username.toLowerCase());
        if (found) {
          setEmail(found.email || '');
          setPhone(found.phone || '');
          setPhoto(found.photo || '');
        }
      } catch {/* ignore */}
    }
  }, [open, user]);

  if (!open) return null;

  function validate() {
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Invalid email';
    if (phone && !/^[+0-9()\-\s]{6,20}$/.test(phone)) return 'Invalid phone';
    return null;
  }

  async function save(e) {
    e.preventDefault();
    const vErr = validate();
    if (vErr) { setError(vErr); return; }
    try {
      const users = JSON.parse(localStorage.getItem('auth_users')||'[]');
      const idx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
      if (idx !== -1) {
  const updated = { email: email||undefined, phone: phone||undefined, photo: photo||undefined };
  users[idx] = { ...users[idx], ...updated };
        localStorage.setItem('auth_users', JSON.stringify(users));
  updateProfile(updated);
      }
      setError('');
      onClose();
    } catch (e2) {
      console.error(e2);
      setError('Failed to save');
    }
  }

  return (
    <Modal title="Edit Profile" onClose={onClose} width={500}>
      <form className="m-form" onSubmit={save}>
        <div className="m-field">
          <label>Username</label>
          <input value={user?.username||''} disabled />
        </div>
        <div className="m-field">
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="m-field">
          <label>Phone</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 555 123 4567" />
        </div>
        <div className="m-field">
          <label>Profile Photo</label>
          <input value={photo.startsWith('data:') ? '' : photo} onChange={e=>setPhoto(e.target.value)} placeholder="https://... (or use upload below)" />
          <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginTop:6}}>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
            <button type="button" className="btn-secondary" onClick={()=>fileInputRef.current?.click()}>Upload</button>
            {fileInfo && <span style={{fontSize:12,color:'#475569'}}>{fileInfo.name} ({Math.round(fileInfo.size/1024)}KB)</span>}
            {photo && <button type="button" className="btn-secondary" onClick={()=>{setPhoto(''); setFileInfo(null);}}>Remove</button>}
          </div>
          <div ref={dropRef} onDragOver={e=>{e.preventDefault(); if(dropRef.current) dropRef.current.style.borderColor='#2563eb';}} onDragLeave={e=>{if(dropRef.current) dropRef.current.style.borderColor='#cbd5e1';}} onDrop={handleDrop}
            style={{marginTop:8,padding:'14px 12px',border:'2px dashed #cbd5e1',borderRadius:10,fontSize:12,color:'#475569',textAlign:'center',background:'#f8fafc'}}>
            Drag & drop an image here (auto center-cropped to square) – optional
          </div>
          {photo && <div style={{marginTop:8}}><img src={photo} alt="preview" style={{maxWidth:100, borderRadius:10, border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,.15)'}} onError={()=>setPhoto('')} /></div>}
          <p style={{fontSize:11, color:'#64748b', margin:'6px 2px 0'}}>Small images recommended. Data is stored locally only.</p>
        </div>
        {error && <div className="m-error">{error}</div>}
        <div className="m-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function cropSquare(dataUrl, size = 160) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side)/2;
      const sy = (img.height - side)/2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Handlers injected above via onChange / onDrop (kept outside for clarity)
async function processImageFile(file, setPhoto, setFileInfo) {
  if (!file) return;
  if (file.size > 512 * 1024) { alert('Image too large (max 512KB)'); return; }
  const raw = await readFileAsDataURL(file);
  const cropped = await cropSquare(raw, 160);
  setPhoto(cropped);
  setFileInfo({ name:file.name, size:file.size });
}
