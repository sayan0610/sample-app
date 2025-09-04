export function openEditWindow(task, apiBase, onError) {
  const w = window.open(
    '',
    `edit-task-${task.id}`,
    'width=460,height=420,resizable=no,menubar=no,toolbar=no'
  );
  if (!w) {
    onError?.('Popup blocked');
    return;
  }
  const apiUrl = `${apiBase.replace(/\/+$/,'')}/api/tasks/${task.id}`;
  w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/>
<title>Edit Task #${task.id}</title>
<style>
body { font-family: system-ui,sans-serif; margin:20px; background:#f8fafc; color:#0f172a; }
h2 { margin-top:0; color:#2563eb; }
form { display:flex; flex-direction:column; gap:12px; }
label { font-size:13px; font-weight:600; }
input[type=text], textarea { padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; background:#fff; outline:none; }
input:focus, textarea:focus { border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.25); }
.buttons { display:flex; gap:10px; }
button { border:none; cursor:pointer; font-weight:600; padding:10px 18px; border-radius:8px; font-size:14px; background:linear-gradient(90deg,#6366f1,#2563eb); color:#fff; }
button.secondary { background:#475569; }
.status-row { display:flex; align-items:center; gap:8px; font-size:13px; }
.error { background:#fee2e2; color:#991b1b; padding:6px 10px; border-radius:6px; font-size:13px; display:none; }
</style></head><body>
<h2>Edit Task</h2>
<form id="edit-form">
  <div>
    <label for="title">Title</label>
    <input id="title" value="${escapeHtml(task.title)}" required />
  </div>
  <div>
    <label for="details">Details</label>
    <textarea id="details" rows="4">${escapeHtml(task.details || '')}</textarea>
  </div>
  <div class="status-row">
    <input id="completed" type="checkbox" ${task.completed ? 'checked' : ''} />
    <label for="completed" style="font-weight:500;">Completed</label>
  </div>
  <div class="error" id="errBox"></div>
  <div class="buttons">
    <button type="submit">Save</button>
    <button type="button" class="secondary" onclick="window.close()">Cancel</button>
  </div>
</form>
<script>
const form=document.getElementById('edit-form');
const errBox=document.getElementById('errBox');
form.addEventListener('submit',async(e)=>{
  e.preventDefault();
  errBox.style.display='none';
  const payload={
    title:document.getElementById('title').value.trim(),
    details:document.getElementById('details').value.trim(),
    completed:document.getElementById('completed').checked
  };
  if(!payload.title){errBox.textContent='Title required';errBox.style.display='block';return;}
  try{
    const r=await fetch('${apiUrl}',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!r.ok) throw new Error(await r.text()||'Update failed');
    window.opener?.postMessage({type:'taskUpdated',id:${task.id}},'*');
    window.close();
  }catch(err){
    errBox.textContent=err.message;
    errBox.style.display='block';
  }
});
</script>
</body></html>`);
  w.document.close();
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}