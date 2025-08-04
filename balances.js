const totalOweEl = document.getElementById("totalOwe");
const totalOwedEl = document.getElementById("totalOwed");
const netBalanceEl = document.getElementById("netBalance");
const settlementsList = document.getElementById("settlementsList");
const historyList = document.getElementById("historyList");

window.addEventListener("DOMContentLoaded", () => {
  const selectedGroup = JSON.parse(localStorage.getItem("selectedGroup"));

  if (!selectedGroup) {
    document.querySelector("main").innerHTML = '<div class="no-groups">No group selected</div>';
    return;
  }

  document.getElementById("balanceTitle").innerHTML = `<span class="back-arrow" id="backToGroup">&larr;</span> ${selectedGroup.name}`;

  document.getElementById("recordPaymentBtn").addEventListener("click", () => {
    document.getElementById("paymentModal").classList.add("show");
    renderDropdowns();
  });

  document.getElementById("closePaymentModal").addEventListener("click", () => {
    document.getElementById("paymentModal").classList.remove("show");
  });

  document.getElementById("submitPayment").addEventListener("click", recordPayment);

  document.getElementById("backToGroup").addEventListener("click", () => {
    window.location.href = "group.html";
  });

  document.getElementById("openCreateGroup")?.addEventListener("click", () => {
    document.getElementById("createGroupModal").classList.add("show");
  });

  document.getElementById("closeCreateGroupModal")?.addEventListener("click", () => {
    document.getElementById("createGroupModal").classList.remove("show");
  });

  highlightBottomNav();
  calculateAndRender();
});

function highlightBottomNav() {
  document.querySelectorAll(".bottom-nav a").forEach(link => link.classList.remove("active"));
  document.getElementById("balanceIcon")?.classList.add("active");
}

function calculateAndRender() {
  const group = JSON.parse(localStorage.getItem("selectedGroup"));
  if (!group) return;

  const balances = {};
  const expenses = group.expenses || [];
  const members = group.members;

  members.forEach(member => {
    balances[member.name] = 0;
  });

  expenses.forEach(exp => {
    const involvedMembers = exp.membersInvolved || members;
    const share = exp.amount / involvedMembers.length;

    involvedMembers.forEach(member => {
      if (member.name !== exp.paidBy) {
        balances[member.name] -= share;
        balances[exp.paidBy] += share;
      }
    });
  });

  (group.payments || []).forEach(p => {
    balances[p.from] += p.amount;
    balances[p.to] -= p.amount;
  });

  group.balances = balances;
  updateStorage(group);

  renderSummary(balances);
  renderSettlements(balances, group);
  renderHistory(group);
}

function renderSummary(balances) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))?.name;
  const yourBalance = balances[currentUser] || 0;

  let totalYouOwe = 0;
  let totalYouAreOwed = 0;

  if (yourBalance < 0) {
    totalYouOwe = Math.abs(yourBalance);
  } else {
    totalYouAreOwed = yourBalance;
  }

  const net = totalYouAreOwed - totalYouOwe;

  totalOweEl.textContent = `₹${totalYouOwe.toFixed(2)}`;
  totalOwedEl.textContent = `₹${totalYouAreOwed.toFixed(2)}`;
  netBalanceEl.textContent = `₹${net.toFixed(2)}`;
  netBalanceEl.style.color = net < 0 ? 'red' : 'green';
}

function renderSettlements(balances, group) {
  const settlements = [];
  const oweList = [];
  const owedList = [];

  for (let name in balances) {
    const val = balances[name];
    if (val < 0) oweList.push({ name, amount: -val });
    else if (val > 0) owedList.push({ name, amount: val });
  }

  oweList.forEach(debtor => {
    owedList.forEach(creditor => {
      if (debtor.name !== creditor.name && debtor.amount > 0 && creditor.amount > 0) {
        const amount = Math.min(debtor.amount, creditor.amount);
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount.toFixed(2)
        });
        debtor.amount -= amount;
        creditor.amount -= amount;
      }
    });
  });

  settlementsList.innerHTML = "";

  settlements.forEach(s => {
    const li = document.createElement("li");
    li.classList.add("settlement-item");
    const rightText = `${s.from} owes ₹${s.amount} to ${s.to}`;

    li.innerHTML = `
      <div class="settlement-left">${s.from}</div>
      <div class="settlement-right">
        <span>${rightText}</span>
        <button class="pay-btn" data-from="${s.from}" data-to="${s.to}" data-amount="${s.amount}">Pay</button>
      </div>
    `;
    settlementsList.appendChild(li);
  });

  document.querySelectorAll(".pay-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const from = btn.dataset.from;
      const to = btn.dataset.to;
      const amount = parseFloat(btn.dataset.amount);
      openPaymentModal(from, to, amount);
    });
  });
}

function openPaymentModal(from, to, amount) {
  renderDropdowns();
  setTimeout(() => {
    document.getElementById("paymentFrom").value = from;
    document.getElementById("paymentTo").value = to;
    document.getElementById("paymentAmount").value = amount;
  }, 10);
  document.getElementById("paymentModal").classList.add("show");
}

function renderDropdowns() {
  const fromSelect = document.getElementById("paymentFrom");
  const toSelect = document.getElementById("paymentTo");
  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  const group = JSON.parse(localStorage.getItem("selectedGroup"));
  group.members.forEach(m => {
    fromSelect.innerHTML += `<option value="${m.name}">${m.name}</option>`;
    toSelect.innerHTML += `<option value="${m.name}">${m.name}</option>`;
  });
}

function recordPayment() {
  const from = document.getElementById("paymentFrom").value;
  const to = document.getElementById("paymentTo").value;
  const amount = parseFloat(document.getElementById("paymentAmount").value);

  if (!from || !to || from === to || isNaN(amount) || amount <= 0) {
    alert("Invalid payment details");
    return;
  }

  const now = new Date();
  const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const group = JSON.parse(localStorage.getItem("selectedGroup"));

  const newPayment = { from, to, amount, date: timestamp };
  group.payments = group.payments || [];
  group.payments.push(newPayment);

  const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
  activityLog.unshift({
    type: "payment",
    group: group.name,
    from,
    to,
    amount,
    date: new Date().toISOString(),
  });
  localStorage.setItem("activityLog", JSON.stringify(activityLog));

  updateStorage(group);
  document.getElementById("paymentModal").classList.remove("show");
  calculateAndRender();
}

function renderHistory(group) {
  historyList.innerHTML = "";
  const payments = group.payments || [];

  payments.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.from} paid ₹${p.amount.toFixed(2)} to ${p.to} • ${p.date}</span>`;
    historyList.appendChild(li);
  });
}

function updateStorage(updatedGroup) {
  let allGroups = JSON.parse(localStorage.getItem("groups") || "[]");
  allGroups = allGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
  localStorage.setItem("groups", JSON.stringify(allGroups));
  localStorage.setItem("selectedGroup", JSON.stringify(updatedGroup));
}
