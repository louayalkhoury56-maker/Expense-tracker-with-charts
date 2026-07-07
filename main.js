// ===== جلب العناصر =====
const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const typeSelect = document.getElementById("type");
const transactionsList = document.getElementById("transactionsList");
const totalIncome = document.querySelector(".income .summary-card-value");
const totalExpenses = document.querySelector(".expense .summary-card-value");
const currentBalance = document.querySelector(".balance .summary-card-value");
const savingsGoal = document.querySelector(".savings .summary-card-value");
const pieChart = document.getElementById("pieChart");
const pieLegend = document.getElementById("pieLegend");
const barChart = document.getElementById("barChart");

// ===== متغير لتخزين ID المعاملة المراد تعديلها =====
let editingTransactionId = null;

// ===== استرجاع البيانات من LocalStorage =====
let transactions = [];
const savedTransactions = localStorage.getItem("transactions");
if(savedTransactions){
    transactions = JSON.parse(savedTransactions);
}

// ===== عرض المعاملات مع أزرار تعديل وحذف =====
function renderTransactions() {
  transactionsList.innerHTML = "";
  if(transactions.length === 0) {
    transactionsList.innerHTML = '<div style="text-align: center; color: var(--gray); padding: 2rem;">لا توجد معاملات بعد</div>';
    return;
  }
  
  transactions.forEach((transaction) => {
    const HTML = `
      <div class="transaction-item">
        <span>${transaction.description}</span>
        <span>$${transaction.amount.toFixed(2)}</span>
        <span>${transaction.type}</span>
        <span>${transaction.category}</span>
        <button class="edit-btn" data-id="${transaction.id}">✏️</button>
        <button class="delete-btn" data-id="${transaction.id}">❌</button>
      </div>
    `;
    transactionsList.innerHTML += HTML;
  });
}

// ===== تحديث الملخص =====
function updateSummary() {
  let totalIncomeAmount = 0;
  let totalExpensesAmount = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "Income") totalIncomeAmount += transaction.amount;
    else if (transaction.type === "Expense") totalExpensesAmount += transaction.amount;
  });

  const balanceAmount = totalIncomeAmount - totalExpensesAmount;
  const savingsGoalAmount = 1500;
  const savingsPercent = Math.min((balanceAmount / savingsGoalAmount) * 100, 100);

  totalIncome.textContent = `$${totalIncomeAmount.toFixed(2)}`;
  totalExpenses.textContent = `$${totalExpensesAmount.toFixed(2)}`;
  currentBalance.textContent = `$${balanceAmount.toFixed(2)}`;
  savingsGoal.textContent = `${savingsPercent.toFixed(0)}% achieved`;
}

// ===== تحديث Pie Chart =====
function updateCategoryTotal() {
  let categoryObj = {};

  transactions.forEach((t) => {
    if(t.type === "Expense"){
      if(categoryObj[t.category]) categoryObj[t.category] += t.amount;
      else categoryObj[t.category] = t.amount;
    }
  });

  pieChart.innerHTML = "";
  pieLegend.innerHTML = "";

  const totalExpensesAmount = Object.values(categoryObj).reduce((a,b)=>a+b, 0);
  if(totalExpensesAmount === 0){
    pieChart.style.background = "none";
    pieChart.setAttribute('data-value', '$0.00');
    return categoryObj;
  }

  // تعيين القيمة الديناميكية
  pieChart.setAttribute('data-value', `$${totalExpensesAmount.toFixed(2)}`);

  const colors = {
    "Food & Dining": "#ef4444",
    "Transportation": "#f59e0b",
    "Shopping": "#3b82f6",
    "Utilities": "#10b981",
    "Entertainment": "#8b5cf6",
    "Other": "#ec4899"
  };

  let gradient = "";
  let startDeg = 0;
  for(let cat in categoryObj){
    const percent = (categoryObj[cat] / totalExpensesAmount) * 100;
    const endDeg = startDeg + percent*3.6;
    gradient += `${colors[cat]} ${startDeg}deg ${endDeg}deg, `;
    startDeg = endDeg;

    const legendItem = document.createElement("div");
    legendItem.innerHTML = `<span>🔵</span> <span>${cat}: $${categoryObj[cat].toFixed(2)}</span>`;
    pieLegend.appendChild(legendItem);
  }

  pieChart.style.background = `conic-gradient(${gradient.slice(0,-2)})`;
  pieChart.style.borderRadius = "50%";
  pieChart.style.width = "200px";
  pieChart.style.height = "200px";

  return categoryObj;
}

// ===== تحديث Monthly Overview =====
function updateMonthlyOverview() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let incomePerMonth = Array(12).fill(0);
  let expensePerMonth = Array(12).fill(0);

  transactions.forEach(t => {
    let date = t.date ? new Date(t.date) : new Date();
    let monthIndex = date.getMonth();
    if(t.type === "Income") incomePerMonth[monthIndex] += t.amount;
    else if(t.type === "Expense") expensePerMonth[monthIndex] += t.amount;
  });

  barChart.innerHTML = "";
  const maxIncomeHeight = Math.max(...incomePerMonth) || 1;
  const maxExpenseHeight = Math.max(...expensePerMonth) || 1;
  const maxHeight = 200;

  for(let i=0;i<12;i++){
    const incomeHeight = (incomePerMonth[i]/maxIncomeHeight)*maxHeight;
    const expenseHeight = (expensePerMonth[i]/maxExpenseHeight)*maxHeight;

    const div = document.createElement("div");
    div.classList.add("bar-group");
    div.innerHTML = `
      <div class="bar income" style="height:${incomeHeight}px;"></div>
      <div class="bar expense" style="height:${expenseHeight}px;"></div>
      <span class="bar-label">${months[i]}</span>
    `;
    barChart.appendChild(div);
  }
}

// ===== إضافة أو تعديل معاملة =====
transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const description = descriptionInput.value;
  const amount = Number(amountInput.value);
  const category = categorySelect.value;
  const type = typeSelect.value;
  const date = new Date().toISOString();

  if(!description || isNaN(amount) || amount <= 0){
    alert("Please enter a valid description and amount.");
    return;
  }

  if(editingTransactionId) {
    // تعديل معاملة موجودة
    const transactionIndex = transactions.findIndex(t => t.id === editingTransactionId);
    if(transactionIndex !== -1) {
      transactions[transactionIndex] = {
        id: editingTransactionId,
        description: description,
        amount: amount,
        category: category,
        type: type,
        date: transactions[transactionIndex].date
      };
      editingTransactionId = null;
    }
  } else {
    // إضافة معاملة جديدة
    const newTransaction = {
      id: Date.now(),
      description: description,
      amount: amount,
      category: category,
      type: type,
      date: date
    };
    transactions.push(newTransaction);
  }

  localStorage.setItem("transactions", JSON.stringify(transactions));

  renderTransactions();
  updateSummary();
  updateCategoryTotal();
  updateMonthlyOverview();

  transactionForm.reset();
});

// ===== الحذف والتعديل =====
transactionsList.addEventListener("click", (e) => {
  const idClicked = Number(e.target.dataset.id);
  
  // حذف
  if(e.target.classList.contains("delete-btn")){
    if(confirm("هل تريد حذف هذه المعاملة؟")){
      transactions = transactions.filter(t => t.id !== idClicked);
      localStorage.setItem("transactions", JSON.stringify(transactions));
      editingTransactionId = null;
      renderTransactions();
      updateSummary();
      updateCategoryTotal();
      updateMonthlyOverview();
      transactionForm.reset();
    }
  }

  // تعديل
  if(e.target.classList.contains("edit-btn")){
    const transaction = transactions.find(t => t.id === idClicked);
    if(transaction){
      editingTransactionId = idClicked;
      descriptionInput.value = transaction.description;
      amountInput.value = transaction.amount;
      categorySelect.value = transaction.category;
      typeSelect.value = transaction.type;
      
      // التمرير إلى النموذج
      descriptionInput.focus();
      descriptionInput.scrollIntoView({ behavior: "smooth" });
    }
  }
});

// ===== تشغيل عند التحميل =====
renderTransactions();
updateSummary();
updateCategoryTotal();
updateMonthlyOverview();