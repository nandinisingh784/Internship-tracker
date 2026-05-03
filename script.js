 import { remove, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

 import { getDatabase, ref, push, onValue }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYNRMudvEqMm_XHar7r1VlYSw72KCBMYY",
  authDomain: "internship-tracker-9a46f.firebaseapp.com",
  projectId: "internship-tracker-9a46f",
  storageBucket: "internship-tracker-9a46f.firebasestorage.app",
  messagingSenderId: "378045976894",
  appId: "1:378045976894:web:3bdd2bd7290ca72469dc6f",
  measurementId: "G-Y3PY6Q18HR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
let data = [];
let filter = 'All';
let editingIndex = -1;
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (password.length < 6) {
    alert("Password should be at least 6 characters");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("User Created 🎉");

      // optional: auto-login feel
      loadData(userCredential.user.uid);
    })
    .catch(err => alert(err.message));
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Logged In 😎");

      // optional but helps stability
      loadData(userCredential.user.uid);
    })
    .catch(err => alert(err.message));
}

function logout() {
  signOut(auth).then(() => alert("Logged out"));
}
const el = id => document.getElementById(id);

function counts() {
  const total = data.length;
  const applied = data.filter(i => i.status === 'Applied').length;
  const interview = data.filter(i => i.status === 'Interview').length;
  const rejected = data.filter(i => i.status === 'Rejected').length;
  el('total').textContent = total;
  el('appliedCount').textContent = applied;
  el('interviewCount').textContent = interview;
  el('rejectedCount').textContent = rejected;
}

function render() {
  const q = el('search').value.toLowerCase();
  const list = el('list');
  list.innerHTML = '';

  data
    .filter(i => filter === 'All' || i.status === filter)
    .filter(i => i.company.toLowerCase().includes(q) || i.role.toLowerCase().includes(q))
    .forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="left">
          <div class="title">${item.company} — ${item.role}</div>
          <div class="meta">${item.date || ''} • ${item.notes || ''}</div>
        </div>
        <div>
          <span class="badge ${item.status}">${item.status}</span>
          <span class="actions">
            <button onclick="editItem(${idx})">Edit</button>
            <button onclick="removeItem(${idx})">Delete</button>
          </span>
        </div>
      `;
      list.appendChild(div);
    });
  counts();
}

function clearForm() {
  el('company').value = '';
  el('role').value = '';
  el('status').value = 'Applied';
  el('date').value = '';
  el('notes').value = '';
  editingIndex = -1;
}

function addOrUpdate() {
  const company = el('company').value.trim();
  const role = el('role').value.trim();
  const status = el('status').value;
  const date = el('date').value;
  const notes = el('notes').value.trim();
  if (!company || !role) { alert('Fill company and role'); return; }
  const user = auth.currentUser;

  if (editingIndex > -1) {
    const item = data[editingIndex];

    update(ref(db, "users/" + user.uid + "/internships/" + item.id), {
      company,
      role,
      status,
      date,
      notes
    });

    editingIndex = -1;
  }
  else {
    push(ref(db, "users/" + user.uid + "/internships"), {
      company,
      role,
      status,
      date,
      notes
    });
  }

  clearForm();
}

  function editItem(i) {
    const item = data[i];
    el('company').value = item.company;
    el('role').value = item.role;
    el('status').value = item.status;
    el('date').value = item.date || '';
    el('notes').value = item.notes || '';
    editingIndex = i;
  }

  function removeItem(i) {
    const user = auth.currentUser;
    const item = data[i];

    remove(ref(db, "users/" + user.uid + "/internships/" + item.id));
  }

  // events
  el('addBtn').addEventListener('click', addOrUpdate);
  el('search').addEventListener('input', render);

  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter; render();
    });
  });

  render();
  document.getElementById("signupBtn").addEventListener("click", signup);
  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  window.editItem = editItem;
  window.removeItem = removeItem;

  function loadData(userId) {
    const dbRef = ref(db, "users/" + userId + "/internships");

    onValue(dbRef, (snapshot) => {
      data = [];
      snapshot.forEach((child) => {
        data.push({
          id: child.key,
          ...child.val()
        });
      });
      render();
    });
  }
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadData(user.uid);
    } else {
      data = [];
      render();
    }
  });
