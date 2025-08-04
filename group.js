const groupTitle = document.getElementById("groupTitle");
const totalExpenses = document.getElementById("totalExpenses");
const yourBalance = document.getElementById("yourBalance");
const memberCount = document.getElementById("memberCount");
const memberList = document.getElementById("memberList");
const expenseList = document.getElementById("expenseList");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const expenseModal = document.getElementById("expenseModal");
const closeExpenseModal = document.getElementById("closeExpenseModal");
const paidBySelect = document.getElementById("paidBy");
const bottomIcons = document.querySelectorAll(".bottom-nav i");
const addIcon = document.getElementById("addIcon");

const selectedGroup = JSON.parse(localStorage.getItem("selectedGroup")) || null;
const allGroups = JSON.parse(localStorage.getItem("groups")) || [];
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

document.addEventListener("DOMContentLoaded", () => {
  highlightNavIcon("group");

  if (!selectedGroup || !currentUser) {
    document.querySelector(".group-container").innerHTML = `<p class="no-groups">No Groups Created Yet</p>`;
    return;
  }

  renderGroup();
});

function calculateMemberBalances(group) {
  const balances = {};
  group.members.forEach(m => balances[m.name] = 0);

  (group.expenses || []).forEach(exp => {
    const amount = exp.amount;
    const paidBy = exp.paidBy;
    const involved = group.members.map(m => m.name);
    const share = amount / involved.length;

    involved.forEach(member => {
      if (member === paidBy) {
        balances[member] += amount - share; // gets total paid minus their share
      } else {
        balances[member] -= share; // owes their share
      }
    });
  });

  return balances;
}

function renderGroup() {
  groupTitle.innerHTML = `<span class="back-arrow" id="backToHome">&larr;</span> ${selectedGroup.name}`;
  document.getElementById("backToHome").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  memberCount.textContent = selectedGroup.members.length;

  const balances = calculateMemberBalances(selectedGroup);

  let total = 0;
  (selectedGroup.expenses || []).forEach(exp => total += exp.amount);
  totalExpenses.textContent = `$${total.toFixed(2)}`;

  const userBal = balances[currentUser.name] || 0;
  yourBalance.textContent = `$${userBal.toFixed(2)}`;
  yourBalance.style.color = userBal >= 0 ? "#10b981" : "#dc2626";

  memberList.innerHTML = "";
  paidBySelect.innerHTML = "";

  selectedGroup.members.forEach(m => {
    const bal = balances[m.name];
    const status = bal >= 0
      ? `owes you $${bal.toFixed(2)}`
      : `you owe $${Math.abs(bal).toFixed(2)}`;
    const color = bal >= 0 ? "#10b981" : "#dc2626";

    const li = document.createElement("li");
    li.innerHTML = `<strong>${m.name}</strong><span style="color:${color};">${status}</span>`;
    memberList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = m.name;
    paidBySelect.appendChild(opt);
  });

  expenseList.innerHTML = "";
  (selectedGroup.expenses || []).forEach(exp => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${exp.description}</strong><br>
        <small>${exp.date} • Paid by ${exp.paidBy}</small>
      </div>
      <div><strong>$${exp.amount}</strong></div>
    `;
    expenseList.appendChild(li);
  });

  // ✅ Fix: Move totalExpensesBox click here
  const totalExpensesBox = document.getElementById("totalExpensesBox");
  if (totalExpensesBox) {
    totalExpensesBox.style.cursor = "pointer";
    totalExpensesBox.addEventListener("click", () => {
      localStorage.setItem("selectedGroup", JSON.stringify(selectedGroup));
      window.location.href = "balance.html";
    });
  }
}

addExpenseBtn.addEventListener("click", () => {
  expenseModal.classList.add("show");
});

closeExpenseModal.addEventListener("click", () => {
  expenseModal.classList.remove("show");
});

window.addEventListener("click", (e) => {
  if (e.target === expenseModal) {
    expenseModal.classList.remove("show");
  }
});

document.getElementById("submitExpense")?.addEventListener("click", (e) => {
  e.preventDefault();
  const desc = document.getElementById("expenseDescription").value.trim();
  const amt = parseFloat(document.getElementById("expenseAmount").value);
  const paidBy = paidBySelect.value;
  const date = new Date().toLocaleDateString();

  if (!desc || isNaN(amt) || amt <= 0) {
    alert("Please enter valid description and amount.");
    return;
  }

  const newExpense = { description: desc, amount: amt, paidBy, date };

  const groupIndex = allGroups.findIndex(g => g.name === selectedGroup.name);
  if (groupIndex !== -1) {
    allGroups[groupIndex].expenses = allGroups[groupIndex].expenses || [];
    allGroups[groupIndex].expenses.push(newExpense);
    localStorage.setItem("groups", JSON.stringify(allGroups));
    localStorage.setItem("selectedGroup", JSON.stringify(allGroups[groupIndex]));
    window.location.reload();
  }
});

bottomIcons.forEach(icon => {
  icon.addEventListener("click", () => {
    const id = icon.id;
    if (id === "homeIcon") {
      window.location.href = "index.html";
    } else if (id === "groupsIcon") {
      if (!currentUser) {
        alert("Please login first.");
        return;
      }
      const groups = JSON.parse(localStorage.getItem("groups")) || [];
      if (groups.length === 0) {
        window.location.href = "group.html";
      } else {
        const latestGroup = groups[groups.length - 1];
        localStorage.setItem("selectedGroup", JSON.stringify(latestGroup));
        window.location.href = "group.html";
      }
    } else if (id === "balanceIcon") {
      if (!selectedGroup) {
        alert("Select a group first.");
        return;
      }
      localStorage.setItem("selectedGroup", JSON.stringify(selectedGroup));
      window.location.href = "balance.html";
    }
  });
});

addIcon?.addEventListener("click", () => {
  const modal = document.getElementById("createGroupModal");
  if (modal) modal.style.display = "block";
});

function highlightNavIcon(active) {
  bottomIcons.forEach(i => {
    i.classList.remove("active");
    if (
      (active === "group" && i.id === "groupsIcon") ||
      (active === "home" && i.id === "homeIcon") ||
      (active === "balance" && i.id === "balanceIcon")
    ) {
      i.classList.add("active");
    }
  });
}



