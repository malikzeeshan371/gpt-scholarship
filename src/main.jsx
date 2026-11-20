import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const STORAGE_KEY = 'daymark-todos'
const USERS_KEY = 'daymark-users'
const SESSION_KEY = 'daymark-session'

const starterTasks = [
  { id: 1, title: 'Review the project brief', note: 'Highlight the key outcomes and open questions.', category: 'Work', priority: 'High', due: 'Today', completed: false, createdAt: Date.now() - 500000 },
  { id: 2, title: 'Book a table for Friday', note: 'Try the new place near the river.', category: 'Personal', priority: 'Medium', due: 'Tomorrow', completed: false, createdAt: Date.now() - 400000 },
  { id: 3, title: 'Organize desktop files', note: 'Archive old downloads and tidy the workspace.', category: 'Home', priority: 'Low', due: 'This week', completed: true, createdAt: Date.now() - 300000 },
]

const icon = {
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
  search: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>,
  sun: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.7" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></svg>,
  check: <svg viewBox="0 0 24 24"><path d="m5 12 4.3 4.3L19 6.7" /></svg>,
  edit: <svg viewBox="0 0 24 24"><path d="m4 16.5-.8 3.8 3.8-.8L18.6 7.9a2.1 2.1 0 0 0-3-3L4 16.5Z" /><path d="m13.8 6.7 3 3" /></svg>,
  trash: <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l.8 13h10.4L18 7M9 7V4h6v3" /></svg>,
  calendar: <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>,
  close: <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>,
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(SESSION_KEY))
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${localStorage.getItem(SESSION_KEY) || 'guest'}`)
      return saved ? JSON.parse(saved) : starterTasks
    } catch {
      return starterTasks
    }
  })
  const [activeFilter, setActiveFilter] = useState('All tasks')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (currentUser) localStorage.setItem(`${STORAGE_KEY}-${currentUser}`, JSON.stringify(tasks))
  }, [tasks, currentUser])

  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
    high: tasks.filter((task) => task.priority === 'High' && !task.completed).length,
  }), [tasks])

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks
      .filter((task) => {
        if (activeFilter === 'Today') return task.due === 'Today'
        if (activeFilter === 'Upcoming') return task.due !== 'Today' && !task.completed
        if (activeFilter === 'Completed') return task.completed
        return true
      })
      .filter((task) => !query || `${task.title} ${task.note} ${task.category}`.toLowerCase().includes(query))
      .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt)
  }, [tasks, activeFilter, search])

  function saveTask(taskData) {
    if (editingTask) {
      setTasks((current) => current.map((task) => task.id === editingTask.id ? { ...task, ...taskData } : task))
      showNotice('Task updated')
    } else {
      setTasks((current) => [{ ...taskData, id: Date.now(), completed: false, createdAt: Date.now() }, ...current])
      showNotice('Task added')
    }
    setShowForm(false)
    setEditingTask(null)
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task))
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
    showNotice('Task deleted')
  }

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  function startEdit(task) {
    setEditingTask(task)
    setShowForm(true)
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
  }

  if (!currentUser) return <AuthScreen onAuthenticated={(email) => {
    localStorage.setItem(SESSION_KEY, email)
    window.location.reload()
  }} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">{icon.check}</div><span>daymark</span></div>
        <div className="sidebar-label">Workspace</div>
        <nav className="nav-list">
          <button className={`nav-item ${activeFilter === 'All tasks' ? 'selected' : ''}`} onClick={() => setActiveFilter('All tasks')}><span className="nav-icon">{icon.sun}</span>All tasks <b>{counts.all}</b></button>
          <button className={`nav-item ${activeFilter === 'Today' ? 'selected' : ''}`} onClick={() => setActiveFilter('Today')}><span className="nav-icon">{icon.calendar}</span>Today <b>{tasks.filter((task) => task.due === 'Today').length}</b></button>
          <button className={`nav-item ${activeFilter === 'Upcoming' ? 'selected' : ''}`} onClick={() => setActiveFilter('Upcoming')}><span className="nav-icon upcoming-dot" />Upcoming <b>{counts.active}</b></button>
          <button className={`nav-item ${activeFilter === 'Completed' ? 'selected' : ''}`} onClick={() => setActiveFilter('Completed')}><span className="nav-icon">{icon.check}</span>Completed <b>{counts.completed}</b></button>
        </nav>
        <div className="sidebar-label category-label">Categories</div>
        <div className="category-list">
          <span><i className="dot coral" />Work</span>
          <span><i className="dot blue" />Personal</span>
          <span><i className="dot lavender" />Home</span>
        </div>
        <div className="sidebar-footer"><div className="avatar">{currentUser[0].toUpperCase()}</div><div><strong>{currentUser.split('@')[0]}</strong><small>Local only</small></div><button className="logout-button" onClick={logout}>Log out</button></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark">{icon.check}</div><span>daymark</span></div>
          <div className="search-wrap"><span>{icon.search}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." /><kbd>⌘ K</kbd></div>
          <button className="add-button" onClick={() => { setEditingTask(null); setShowForm(true) }}>{icon.plus}<span>New task</span></button>
        </header>

        <section className="content-inner">
          <div className="welcome-row">
            <div><p className="eyebrow">Tuesday, November 10</p><h1>Good morning, {currentUser.split('@')[0]} <span>✦</span></h1><p className="subtitle">A little progress each day adds up to big results.</p></div>
            <div className="progress-card"><div className="progress-copy"><span>Daily progress</span><strong>{counts.completed}/{counts.all || 0}</strong></div><div className="progress-track"><div style={{ width: `${counts.all ? (counts.completed / counts.all) * 100 : 0}%` }} /></div><small>{counts.all ? Math.round((counts.completed / counts.all) * 100) : 0}% complete</small></div>
          </div>
          <div className="summary-grid"><div className="summary-card"><span className="summary-icon peach">{icon.sun}</span><div><strong>{counts.active}</strong><small>Tasks to focus on</small></div></div><div className="summary-card"><span className="summary-icon rose">{icon.calendar}</span><div><strong>{tasks.filter((task) => task.due === 'Today').length}</strong><small>Due today</small></div></div><div className="summary-card"><span className="summary-icon mint">{icon.check}</span><div><strong>{counts.completed}</strong><small>Completed this week</small></div></div></div>

          <div className="tasks-heading"><div><h2>{activeFilter}</h2><span>{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</span></div><div className="view-options"><button className="view-active">☷</button><button>▦</button></div></div>
          <div className="task-list">
            {visibleTasks.length ? visibleTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} onEdit={startEdit} onDelete={deleteTask} />) : <div className="empty-state"><div>✦</div><h3>No tasks here</h3><p>Enjoy the clear space, or add something new.</p><button onClick={() => setShowForm(true)}>Create a task</button></div>}
          </div>
        </section>
      </main>
      {showForm && <TaskForm task={editingTask} onSave={saveTask} onClose={() => { setShowForm(false); setEditingTask(null) }} />}
      {notice && <div className="toast"><span>{icon.check}</span>{notice}</div>}
    </div>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your name to create your account.')
      return
    }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
    if (mode === 'signup') {
      if (users[normalizedEmail]) {
        setError('An account with this email already exists.')
        return
      }
      users[normalizedEmail] = { name: name.trim(), password }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
      onAuthenticated(normalizedEmail)
      return
    }
    if (!users[normalizedEmail] || users[normalizedEmail].password !== password) {
      setError('That email and password combination is not recognized.')
      return
    }
    onAuthenticated(normalizedEmail)
  }

  return <div className="auth-page">
    <div className="auth-visual"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-visual-content"><div className="brand auth-brand"><div className="brand-mark">{icon.check}</div><span>daymark</span></div><div className="auth-quote"><span>✦</span><h1>Make space for<br /><em>what matters.</em></h1><p>A calm, focused place for your everyday plans and big ideas.</p></div><div className="auth-stat"><strong>Small steps.</strong><span>Meaningful progress.</span></div></div></div>
    <div className="auth-panel"><div className="auth-panel-inner"><p className="auth-kicker">Your personal workspace</p><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="auth-intro">{mode === 'login' ? 'Pick up right where you left off.' : 'Start turning intentions into progress.'}</p><div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Log in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError('') }}>Sign up</button></div><form className="auth-form" onSubmit={submit}>{mode === 'signup' && <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Malik Zeeshan" autoComplete="name" /></label>}<label>Email address<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>{error && <div className="auth-error">{error}</div>}<button className="auth-submit" type="submit">{mode === 'login' ? 'Log in to Daymark' : 'Create local account'}<span>→</span></button></form><p className="auth-note">Your account is stored locally in this browser for now.</p></div></div>
  </div>
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  return <article className={`task-card ${task.completed ? 'is-complete' : ''}`}>
    <button className={`checkbox ${task.completed ? 'checked' : ''}`} onClick={() => onToggle(task.id)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed && icon.check}</button>
    <div className="task-body"><div className="task-title-row"><h3>{task.title}</h3><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div>{task.note && <p>{task.note}</p>}<div className="task-meta"><span><i className={`dot ${task.category === 'Work' ? 'coral' : task.category === 'Personal' ? 'blue' : 'lavender'}`} />{task.category}</span><span className={task.due === 'Today' ? 'due-today' : ''}>{icon.calendar}{task.due}</span></div></div>
    <div className="task-actions"><button onClick={() => onEdit(task)} aria-label="Edit task">{icon.edit}</button><button onClick={() => onDelete(task.id)} aria-label="Delete task">{icon.trash}</button></div>
  </article>
}

function TaskForm({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title || '')
  const [note, setNote] = useState(task?.note || '')
  const [category, setCategory] = useState(task?.category || 'Work')
  const [priority, setPriority] = useState(task?.priority || 'Medium')
  const [due, setDue] = useState(task?.due || 'Today')
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    if (!title.trim()) { setError('Give your task a title first.'); return }
    onSave({ title: title.trim(), note: note.trim(), category, priority, due })
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="task-form" onSubmit={submit}><div className="form-header"><div><p className="eyebrow">{task ? 'Make an adjustment' : 'Make it happen'}</p><h2>{task ? 'Edit task' : 'New task'}</h2></div><button type="button" className="close-button" onClick={onClose}>{icon.close}</button></div><label>Task title<input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} placeholder="What needs to be done?" /></label>{error && <span className="form-error">{error}</span>}<label>Notes <span>Optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a little context..." rows="3" /></label><div className="form-row"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Work</option><option>Personal</option><option>Home</option></select></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></label></div><label>Due date<select value={due} onChange={(event) => setDue(event.target.value)}><option>Today</option><option>Tomorrow</option><option>This week</option><option>Someday</option></select></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="save-button" type="submit">{task ? 'Save changes' : 'Add task'} {icon.plus}</button></div></form></div>
}

createRoot(document.getElementById('root')).render(<App />)
