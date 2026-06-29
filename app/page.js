'use client';

import { useEffect, useMemo, useState } from 'react';

const COLOR_LABELS = {
  gray: 'Work',
  green: 'Kernel / app',
  purple: 'Personal / music',
  pink: 'Us time',
  blue: 'Friends',
  orange: 'Event',
  mia: "Mia's stuff",
  rest: 'Rest / reset'
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const sampleBlocks = [
  [
    {id:'mon-work', color:'gray', label:'Work', text:'9–5 at the office.', flexible:false},
    {id:'mon-kernel', color:'green', label:'Kernel', text:'After 5:30 — working with Hugh on Kernel for about 2 hours. Home by ~7:30.', flexible:false},
    {id:'mon-groceries', color:'rest', label:'Groceries', text:'Grocery shopping after getting home — flexible depending on how the Kernel session goes.', flexible:true}
  ],
  [
    {id:'tue-work', color:'gray', label:'Work', text:'9–5 at the office.', flexible:false},
    {id:'tue-soccer', color:'gray', label:'Soccer?', text:'Possible soccer game in the evening — either tonight or Thursday, TBD.', flexible:true},
    {id:'tue-sleepover', color:'pink', label:'Sleepover 🌙', text:'Come over after work (or after the game if there is one). Music, cook together, eat, watch our show, stay the night.', flexible:false}
  ],
  [
    {id:'wed-work', color:'gray', label:'Work', text:'9–5 at the office.', flexible:false},
    {id:'wed-personal', color:'purple', label:'Personal time', text:'After work: music promo, TikToks, solo app work, cool-down — whatever I need to recharge and get things done.', flexible:false}
  ],
  [
    {id:'thu-work', color:'gray', label:'Work', text:'9–5 at the office.', flexible:false},
    {id:'thu-personal', color:'purple', label:'Personal time', text:'After work: same as Wednesday — music, app, personal projects, reset.', flexible:false},
    {id:'thu-soccer', color:'gray', label:'Soccer?', text:"Possible soccer game tonight if it didn't happen Tuesday. You're totally welcome to come watch!", flexible:true},
    {id:'thu-sleepover', color:'pink', label:'Sleepover 🌙', text:"Sleepover tonight either way — if there's a game it starts after, if not we've got the whole evening.", flexible:false}
  ],
  [
    {id:'fri-work', color:'gray', label:'Work', text:'9–5 at the office.', flexible:false},
    {id:'fri-boys', color:'blue', label:'Boys night', text:"Evening out with the guys — dinner, drinks, maybe hit a bar. Important to me, haven't seen them enough lately.", flexible:false}
  ],
  [
    {id:'sat-us', color:'pink', label:'Us time ☀️', text:'Meeting up during the day — grab a couple drinks together, hang, keep it easy.', flexible:false},
    {id:'sat-chris', color:'orange', label:'Chris Stussy', text:'Night event — Chris Stussy. Big one. Should be a great night.', flexible:false},
    {id:'sat-wind', color:'rest', label:'Wind down', text:"After the event: rest and decompress. It's an expensive, big night and I'll probably be drained — no pressure for anything after.", flexible:false}
  ],
  [
    {id:'sun-reset', color:'rest', label:'Reset day', text:'Laundry, wrapping up small projects, getting ready for the week ahead. Low-key, slow morning energy.', flexible:false},
    {id:'sun-hang', color:'pink', label:'Come hang?', text:"You're more than welcome to come over — we can both just be in our own flow, getting stuff done side by side. Probably no sleepover, just a chill reset day together.", flexible:true}
  ]
];

const samplePrimaryColors = ['gray', 'pink', 'purple', 'pink', 'blue', 'pink', 'rest'];

function uid(){ return '_' + Math.random().toString(36).slice(2, 10); }
function copyPlan(plan){ return JSON.parse(JSON.stringify(plan)); }
function getDots(blocks){ return [...new Set(blocks.map((b) => b.color))].slice(0, 5); }
function pad2(n){ return String(n).padStart(2, '0'); }

function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function weekKeyOf(monday) {
  return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
}

function parseWeekKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtMonthDay(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function fmtWeekRange(monday) {
  const sunday = addDays(monday, 6);
  const monthStart = monday.toLocaleDateString('en-US', { month: 'long' });
  const monthEnd = sunday.toLocaleDateString('en-US', { month: 'long' });
  if (monthStart === monthEnd) return `${monthStart} ${monday.getDate()}–${sunday.getDate()}`;
  return `${monthStart} ${monday.getDate()} – ${monthEnd} ${sunday.getDate()}`;
}

function buildWeekPlan(monday, useSample) {
  return DAY_NAMES.map((name, i) => ({
    name,
    date: fmtMonthDay(addDays(monday, i)),
    primaryColor: useSample ? samplePrimaryColors[i] : 'gray',
    blocks: useSample ? copyPlan(sampleBlocks[i]) : []
  }));
}

export default function Page() {
  const [thisWeekKey] = useState(() => weekKeyOf(mondayOf(new Date())));
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const weekKey = useMemo(() => weekKeyOf(weekStart), [weekStart]);

  const [plan, setPlan] = useState(() => buildWeekPlan(weekStart, weekKey === thisWeekKey));
  const [openDays, setOpenDays] = useState({});
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [addOpen, setAddOpen] = useState({});
  const [drafts, setDrafts] = useState({});
  const [status, setStatus] = useState('Loading shared plan...');
  const [isSaving, setIsSaving] = useState(false);

  async function loadPlan(key, showStatus = false) {
    try {
      const response = await fetch(`/api/plan?week=${key}`, { cache: 'no-store' });
      const data = await response.json();
      if (data.plan) {
        setPlan(data.plan);
      } else if (key === weekKeyOf(weekStart)) {
        setPlan(buildWeekPlan(parseWeekKey(key), key === thisWeekKey));
      }
      setStatus(data.configured ? 'Shared saving is on.' : 'Backend storage is not configured yet. Add Redis environment variables in Vercel.');
    } catch {
      if (showStatus) setStatus('Could not load the shared plan.');
    }
  }

  async function savePlan(nextPlan, key = weekKey) {
    setPlan(nextPlan);
    setIsSaving(true);
    setStatus('Saving...');
    try {
      const response = await fetch('/api/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: key, plan: nextPlan })
      });
      if (!response.ok) throw new Error('Save failed');
      setStatus('Saved. Shared updates are live.');
    } catch {
      setStatus('Could not save. Check Redis environment variables in Vercel.');
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    setOpenDays({});
    setEditing(null);
    setAddOpen({});
    loadPlan(weekKey, true);
  }, [weekKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSaving && !editing) loadPlan(weekKey, false);
    }, 4000);
    return () => clearInterval(timer);
  }, [isSaving, editing, weekKey]);

  function goToWeek(monday) { setWeekStart(mondayOf(monday)); }
  function prevWeek() { goToWeek(addDays(weekStart, -7)); }
  function nextWeek() { goToWeek(addDays(weekStart, 7)); }
  function pickWeek(value) {
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    goToWeek(new Date(y, m - 1, d));
  }

  function toggleDay(di){ setOpenDays((cur) => ({ ...cur, [di]: !cur[di] })); }
  function startEdit(di, block){ setEditing({ di, id: block.id }); setEditText(block.text); }
  function cancelEdit(){ setEditing(null); setEditText(''); }

  function saveEdit(di, id) {
    const text = editText.trim();
    if (!text) return;
    const next = copyPlan(plan);
    const block = next[di].blocks.find((b) => b.id === id);
    if (block) block.text = text;
    setEditing(null);
    setEditText('');
    savePlan(next);
  }

  function deleteBlock(di, id) {
    const next = copyPlan(plan);
    next[di].blocks = next[di].blocks.filter((b) => b.id !== id);
    savePlan(next);
  }

  function updateDraft(di, field, value) {
    setDrafts((cur) => ({
      ...cur,
      [di]: { label: '', text: '', color: 'gray', flexible: false, ...(cur[di] || {}), [field]: value }
    }));
  }

  function addBlock(di) {
    const draft = { label: '', text: '', color: 'gray', flexible: false, ...(drafts[di] || {}) };
    if (!draft.label.trim() || !draft.text.trim()) {
      alert('Please fill in both the label and details.');
      return;
    }
    const next = copyPlan(plan);
    next[di].blocks.push({ id: uid(), color: draft.color, label: draft.label.trim(), text: draft.text.trim(), flexible: !!draft.flexible });
    setDrafts((cur) => ({ ...cur, [di]: { label: '', text: '', color: 'gray', flexible: false } }));
    setAddOpen((cur) => ({ ...cur, [di]: false }));
    savePlan(next);
  }

  async function clearAll() {
    if (!confirm(`Clear all plans for the week of ${fmtWeekRange(weekStart)} and start fresh?`)) return;
    await savePlan(buildWeekPlan(weekStart, false));
  }

  return (
    <>
      <div className="wrap">
        <header>
          <h1>Week of {fmtWeekRange(weekStart)} 💌</h1>
          <p>Tap a day to see what&apos;s going on</p>

          <div className="week-nav">
            <button className="week-btn" onClick={prevWeek} aria-label="Previous week">‹ Prev</button>
            <input
              type="date"
              className="week-picker"
              value={weekKeyOf(weekStart)}
              onChange={(e) => pickWeek(e.target.value)}
            />
            <button className="week-btn" onClick={nextWeek} aria-label="Next week">Next ›</button>
          </div>

          <div className="status">{status}</div>
          <button className="reset-btn" onClick={clearAll}>Clear all (start new week)</button>
        </header>

        <div className="legend">
          {Object.entries(COLOR_LABELS).map(([key, label]) => (
            <div className="legend-item" key={key}><div className="legend-dot" style={{ background: `var(--c-${key})` }} />{label}</div>
          ))}
        </div>

        <div className="days">
          {plan.map((day, di) => (
            <div className={'day-card' + (openDays[di] ? ' open' : '')} key={`${day.name}-${day.date}`}>
              <div className="day-header" onClick={() => toggleDay(di)}>
                <div className="day-bar" style={{ background: `var(--c-${day.primaryColor})` }} />
                <div className="day-header-inner">
                  <div className="day-name-block"><div className="day-name">{day.name}</div><div className="day-date">{day.date}</div></div>
                  <div className="day-dots">{getDots(day.blocks).map((d) => <div className="day-dot" key={d} style={{ background: `var(--c-${d})` }} />)}</div>
                  <div className="chevron"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div>
                </div>
              </div>

              <div className="day-body">
                <div className="blocks">
                  {day.blocks.map((block) => (
                    <div className="block" key={block.id}>
                      <div className="block-bar" style={{ background: `var(--c-${block.color})` }} />
                      <div className="block-content">
                        <div className="block-label" style={{ color: `var(--c-${block.color})` }}>{block.label}</div>
                        <div className="block-text">{block.text}</div>
                        {block.flexible && <div className="tags"><span className="tag tag-flexible">⚡ flexible</span></div>}
                        <div className="block-actions">
                          <button className="btn-sm" onClick={() => startEdit(di, block)}>edit</button>
                          <button className="btn-sm btn-delete" onClick={() => deleteBlock(di, block.id)}>delete</button>
                        </div>
                        {editing?.id === block.id && <div className="edit-area show"><textarea value={editText} onChange={(e) => setEditText(e.target.value)} /><div className="edit-area-row"><button className="btn-save" onClick={() => saveEdit(di, block.id)}>Save</button><button className="btn-cancel" onClick={cancelEdit}>Cancel</button></div></div>}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="add-block-btn" onClick={() => setAddOpen((cur) => ({ ...cur, [di]: !cur[di] }))}>+ Add event</button>
                {addOpen[di] && <div className="add-form show">
                  <label>Label</label>
                  <input type="text" value={drafts[di]?.label || ''} onChange={(e) => updateDraft(di, 'label', e.target.value)} placeholder="e.g. Dinner, Gym, Call" />
                  <label>Details</label>
                  <textarea value={drafts[di]?.text || ''} onChange={(e) => updateDraft(di, 'text', e.target.value)} placeholder="What's happening?" />
                  <label>Color</label>
                  <select value={drafts[di]?.color || 'gray'} onChange={(e) => updateDraft(di, 'color', e.target.value)}>
                    {Object.entries(COLOR_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                  </select>
                  <div className="add-form-row"><label className="flex-check"><input type="checkbox" checked={!!drafts[di]?.flexible} onChange={(e) => updateDraft(di, 'flexible', e.target.checked)} /> Mark as flexible</label></div>
                  <div className="add-form-row top"><button className="btn-save" onClick={() => addBlock(di)}>Add</button><button className="btn-cancel" onClick={() => setAddOpen((cur) => ({ ...cur, [di]: false }))}>Cancel</button></div>
                </div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx global>{`
        :root{--bg:#f9f8f6;--surface:#ffffff;--surface2:#f3f2ef;--border:rgba(0,0,0,0.09);--border2:rgba(0,0,0,0.15);--text:#1a1a18;--text2:#5a5955;--text3:#8a8985;--radius:14px;--shadow:0 2px 12px rgba(0,0,0,0.07);--c-gray:#888780;--c-green:#3B6D11;--c-purple:#534AB7;--c-pink:#993556;--c-blue:#185FA5;--c-orange:#BA7517;--c-mia:#0E7C86;--c-rest:#639922;--c-amber-l:#faeeda;--c-amber-t:#633806}
        @media (prefers-color-scheme:dark){:root{--bg:#161614;--surface:#1f1f1d;--surface2:#2a2a27;--border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.14);--text:#eeecea;--text2:#a8a6a1;--text3:#6a6865;--shadow:0 2px 16px rgba(0,0,0,0.4);--c-gray:#b4b2a9;--c-green:#97c459;--c-purple:#afa9ec;--c-pink:#ed93b1;--c-blue:#85b7eb;--c-orange:#ef9f27;--c-mia:#5bd0db;--c-rest:#97c459;--c-amber-l:#412402;--c-amber-t:#fac775}}
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;padding:24px 16px 48px;-webkit-font-smoothing:antialiased}.wrap{max-width:600px;margin:0 auto}header{margin-bottom:28px}header h1{font-size:22px;font-weight:600;letter-spacing:-.3px}header p{font-size:14px;color:var(--text2);margin-top:4px}.week-nav{display:flex;align-items:center;gap:8px;margin-top:14px}.week-btn{font-size:13px;font-weight:500;background:var(--surface);border:.5px solid var(--border2);border-radius:8px;padding:7px 12px;cursor:pointer;color:var(--text)}.week-btn:hover{background:var(--surface2)}.week-picker{font-size:13px;font-family:inherit;color:var(--text);background:var(--surface);border:.5px solid var(--border2);border-radius:8px;padding:6px 10px;cursor:pointer}.status{font-size:12px;color:var(--text3);margin-top:10px}.reset-btn{font-size:12px;color:var(--text3);background:none;border:.5px solid var(--border2);border-radius:8px;padding:6px 10px;cursor:pointer;margin-top:10px}.reset-btn:hover{background:var(--surface2);color:var(--text)}.legend{display:flex;flex-wrap:wrap;gap:8px;background:var(--surface);border:.5px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:20px}.legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2)}.legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}.days{display:flex;flex-direction:column;gap:10px}.day-card{background:var(--surface);border:.5px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}.day-header{display:flex;align-items:center;cursor:pointer;user-select:none;min-height:62px}.day-bar{width:5px;align-self:stretch;flex-shrink:0}.day-header-inner{display:flex;align-items:center;flex:1;padding:14px;gap:12px;min-width:0}.day-name-block{flex:1;min-width:0}.day-name{font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.day-date{font-size:12px;color:var(--text3);margin-top:1px}.day-dots{display:flex;align-items:center;gap:5px;flex-shrink:0}.day-dot{width:8px;height:8px;border-radius:50%}.chevron{width:18px;height:18px;flex-shrink:0;color:var(--text3);transition:transform .25s;display:flex;align-items:center;justify-content:center}.chevron svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.day-card.open .chevron{transform:rotate(180deg)}.day-body{display:none;border-top:.5px solid var(--border);padding:16px 18px 18px 22px}.day-card.open .day-body{display:block}.block{display:flex;gap:12px;align-items:flex-start;padding:10px 0}.block:not(:last-child){border-bottom:.5px solid var(--border)}.block-bar{width:3px;border-radius:99px;margin-top:3px;flex-shrink:0;align-self:stretch;min-height:20px}.block-content{flex:1;min-width:0}.block-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}.block-text{font-size:14px;line-height:1.55;color:var(--text2)}.tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.tag{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;padding:3px 8px;border-radius:20px}.tag-flexible{background:var(--c-amber-l);color:var(--c-amber-t)}.block-actions{display:flex;gap:6px;margin-top:7px;align-items:center}.btn-sm{font-size:11px;font-weight:500;background:none;border:.5px solid var(--border2);border-radius:6px;padding:3px 8px;cursor:pointer;color:var(--text3)}.btn-sm:hover{background:var(--surface2);color:var(--text)}.btn-delete{color:#c0392b;border-color:rgba(192,57,43,.3)}.edit-area{margin-top:8px}.edit-area textarea{width:100%;font-size:13px;font-family:inherit;color:var(--text);background:var(--surface2);border:.5px solid var(--border2);border-radius:8px;padding:10px 12px;resize:vertical;min-height:72px;line-height:1.5}.edit-area-row,.add-form-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center}.btn-save{font-size:12px;font-weight:600;color:#fff;background:var(--c-purple);border:none;border-radius:7px;padding:6px 14px;cursor:pointer}.btn-cancel{font-size:12px;font-weight:500;color:var(--text3);background:none;border:.5px solid var(--border2);border-radius:7px;padding:6px 12px;cursor:pointer}.add-block-btn{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text3);background:none;border:.5px dashed var(--border2);border-radius:10px;width:100%;padding:10px 14px;cursor:pointer;margin-top:12px}.add-block-btn:hover{background:var(--surface2);color:var(--text)}.add-form{margin-top:10px;background:var(--surface2);border:.5px solid var(--border2);border-radius:10px;padding:14px}.add-form label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);display:block;margin-bottom:5px}.add-form input[type=text],.add-form textarea,.add-form select{width:100%;font-size:13px;font-family:inherit;color:var(--text);background:var(--surface);border:.5px solid var(--border2);border-radius:7px;padding:8px 10px;margin-bottom:10px;line-height:1.5}.add-form textarea{resize:vertical;min-height:60px}.flex-check{display:flex!important;align-items:center;gap:6px;font-size:13px!important;color:var(--text2)!important;cursor:pointer;text-transform:none!important;letter-spacing:0!important}.flex-check input{width:15px;height:15px;cursor:pointer;accent-color:#BA7517}.top{margin-top:10px}
      `}</style>
    </>
  );
}
