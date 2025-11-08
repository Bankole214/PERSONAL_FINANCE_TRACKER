// Application State
const state = {
  transactions: [],
  categories: [
    { id: 1, name: "Salary", type: "income", color: "#28a745" },
    { id: 2, name: "Freelance", type: "income", color: "#17a2b8" },
    { id: 3, name: "Investments", type: "income", color: "#6f42c1" },
    { id: 4, name: "Food", type: "expense", color: "#fd7e14" },
    { id: 5, name: "Transportation", type: "expense", color: "#20c997" },
    { id: 6, name: "Entertainment", type: "expense", color: "#e83e8c" },
    { id: 7, name: "Utilities", type: "expense", color: "#6c757d" },
    { id: 8, name: "Healthcare", type: "expense", color: "#dc3545" },
  ],
  nextTransactionId: 1,
  nextCategoryId: 9,
};

// DOM Elements
const elements = {
  balanceAmount: document.getElementById("balanceAmount"),
  totalIncome: document.getElementById("totalIncome"),
  totalExpenses: document.getElementById("totalExpenses"),
  transactionsBody: document.getElementById("transactionsBody"),
  emptyTransactions: document.getElementById("emptyTransactions"),
  transactionForm: document.getElementById("transactionForm"),
  transactionType: document.getElementById("transactionType"),
  transactionCategory: document.getElementById("transactionCategory"),
  categoryFilter: document.getElementById("categoryFilter"),
  typeFilter: document.getElementById("typeFilter"),
  dateFilter: document.getElementById("dateFilter"),
  searchFilter: document.getElementById("searchFilter"),
  clearFilters: document.getElementById("clearFilters"),
  tabs: document.querySelectorAll(".tab"),
  tabContents: document.querySelectorAll(".tab-content"),
  exportBtn: document.getElementById("exportBtn"),
  manageCategoriesBtn: document.getElementById("manageCategoriesBtn"),
  categoriesModal: document.getElementById("categoriesModal"),
  closeModal: document.querySelector(".close-modal"),
  categoriesList: document.getElementById("categoriesList"),
  addCategoryBtn: document.getElementById("addCategoryBtn"),
  newCategoryName: document.getElementById("newCategoryName"),
  newCategoryType: document.getElementById("newCategoryType"),
  newCategoryColor: document.getElementById("newCategoryColor"),
  incomeExpenseChart: document.getElementById("incomeExpenseChart"),
  expenseChart: document.getElementById("expenseChart"),
};

// Initialize the application
function init() {
  loadData();
  setupEventListeners();
  renderCategories();
  updateBalance();
  renderTransactions();
  updateCharts();
}

// Load data from localStorage
function loadData() {
  const savedTransactions = localStorage.getItem("financeTrackerTransactions");
  const savedCategories = localStorage.getItem("financeTrackerCategories");
  const savedIds = localStorage.getItem("financeTrackerIds");

  if (savedTransactions) {
    state.transactions = JSON.parse(savedTransactions);
  }

  if (savedCategories) {
    state.categories = JSON.parse(savedCategories);
  }

  if (savedIds) {
    const ids = JSON.parse(savedIds);
    state.nextTransactionId = ids.nextTransactionId || 1;
    state.nextCategoryId = ids.nextCategoryId || 9;
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem(
    "financeTrackerTransactions",
    JSON.stringify(state.transactions)
  );
  localStorage.setItem(
    "financeTrackerCategories",
    JSON.stringify(state.categories)
  );
  localStorage.setItem(
    "financeTrackerIds",
    JSON.stringify({
      nextTransactionId: state.nextTransactionId,
      nextCategoryId: state.nextCategoryId,
    })
  );
}

// Set up event listeners
function setupEventListeners() {
  // Form submission
  elements.transactionForm.addEventListener("submit", handleAddTransaction);

  // Tab switching
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Filter changes
  elements.typeFilter.addEventListener("change", renderTransactions);
  elements.categoryFilter.addEventListener("change", renderTransactions);
  elements.dateFilter.addEventListener("change", renderTransactions);
  elements.searchFilter.addEventListener("input", renderTransactions);
  elements.clearFilters.addEventListener("click", clearFilters);

  // Export and category management
  elements.exportBtn.addEventListener("click", exportToCSV);
  elements.manageCategoriesBtn.addEventListener("click", () => {
    elements.categoriesModal.style.display = "flex";
  });

  // Modal events
  elements.closeModal.addEventListener("click", () => {
    elements.categoriesModal.style.display = "none";
  });
  elements.addCategoryBtn.addEventListener("click", addCategory);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === elements.categoriesModal) {
      elements.categoriesModal.style.display = "none";
    }
  });
}

// Switch between tabs
function switchTab(tabId) {
  elements.tabs.forEach((tab) => {
    tab.classList.remove("active");
  });
  elements.tabContents.forEach((content) => {
    content.classList.remove("active");
  });

  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add("active");
  document.getElementById(tabId).classList.add("active");

  if (tabId === "charts") {
    updateCharts();
  }
}

// Handle adding a new transaction
function handleAddTransaction(e) {
  e.preventDefault();

  const type = elements.transactionType.value;
  const amount = parseFloat(elements.transactionAmount.value);
  const description = elements.transactionDescription.value;
  const categoryId = parseInt(elements.transactionCategory.value);
  const date = elements.transactionDate.value;
  const notes = elements.transactionNotes.value;

  const transaction = {
    id: state.nextTransactionId++,
    type,
    amount,
    description,
    categoryId,
    date,
    notes,
    createdAt: new Date().toISOString(),
  };

  state.transactions.push(transaction);
  saveData();
  updateBalance();
  renderTransactions();
  updateCharts();

  // Reset form
  elements.transactionForm.reset();
  elements.transactionDate.value = new Date().toISOString().split("T")[0];

  // Switch to transactions tab
  switchTab("transactions");
}

// Delete a transaction
function deleteTransaction(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    state.transactions = state.transactions.filter((t) => t.id !== id);
    saveData();
    updateBalance();
    renderTransactions();
    updateCharts();
  }
}

// Update balance display
function updateBalance() {
  const income = state.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  elements.totalIncome.textContent = `$${income.toFixed(2)}`;
  elements.totalExpenses.textContent = `$${expenses.toFixed(2)}`;
  elements.balanceAmount.textContent = `$${Math.abs(balance).toFixed(2)}`;

  if (balance >= 0) {
    elements.balanceAmount.className = "balance-amount positive";
  } else {
    elements.balanceAmount.className = "balance-amount negative";
  }
}

// Render transactions table
function renderTransactions() {
  const typeFilter = elements.typeFilter.value;
  const categoryFilter = elements.categoryFilter.value;
  const dateFilter = elements.dateFilter.value;
  const searchFilter = elements.searchFilter.value.toLowerCase();

  let filteredTransactions = state.transactions;

  // Apply filters
  if (typeFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.type === typeFilter
    );
  }

  if (categoryFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.categoryId === parseInt(categoryFilter)
    );
  }

  if (dateFilter !== "all") {
    const now = new Date();
    filteredTransactions = filteredTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      switch (dateFilter) {
        case "today":
          return transactionDate.toDateString() === now.toDateString();
        case "week":
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return transactionDate >= startOfWeek;
        case "month":
          return (
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
          );
        case "year":
          return transactionDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }

  if (searchFilter) {
    filteredTransactions = filteredTransactions.filter(
      (t) =>
        t.description.toLowerCase().includes(searchFilter) ||
        t.notes.toLowerCase().includes(searchFilter)
    );
  }

  // Sort by date (newest first)
  filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Render transactions
  if (filteredTransactions.length === 0) {
    elements.emptyTransactions.style.display = "block";
    elements.transactionsBody.innerHTML = "";
  } else {
    elements.emptyTransactions.style.display = "none";
    elements.transactionsBody.innerHTML = filteredTransactions
      .map((transaction) => {
        const category = state.categories.find(
          (c) => c.id === transaction.categoryId
        );
        return `
                        <tr>
                            <td>${formatDate(transaction.date)}</td>
                            <td>${transaction.description}</td>
                            <td>
                                <span class="badge ${
                                  transaction.type === "income"
                                    ? "badge-income"
                                    : "badge-expense"
                                }">
                                    ${
                                      category ? category.name : "Uncategorized"
                                    }
                                </span>
                            </td>
                            <td>${
                              transaction.type === "income"
                                ? "Income"
                                : "Expense"
                            }</td>
                            <td class="${
                              transaction.type === "income"
                                ? "positive"
                                : "negative"
                            }">
                                ${
                                  transaction.type === "income" ? "+" : "-"
                                }$${transaction.amount.toFixed(2)}
                            </td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteTransaction(${
                                  transaction.id
                                })">Delete</button>
                            </td>
                        </tr>
                    `;
      })
      .join("");
  }
}

// Clear all filters
function clearFilters() {
  elements.typeFilter.value = "all";
  elements.categoryFilter.value = "all";
  elements.dateFilter.value = "all";
  elements.searchFilter.value = "";
  renderTransactions();
}

// Render category dropdowns
function renderCategories() {
  // Clear existing options
  elements.transactionCategory.innerHTML = "";
  elements.categoryFilter.innerHTML =
    '<option value="all">All Categories</option>';

  // Add categories to transaction form
  state.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.transactionCategory.appendChild(option);
  });

  // Add categories to filter
  state.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.categoryFilter.appendChild(option);
  });

  // Set default date to today
  elements.transactionDate.value = new Date().toISOString().split("T")[0];
}

// Add a new category
function addCategory() {
  const name = elements.newCategoryName.value.trim();
  const type = elements.newCategoryType.value;
  const color = elements.newCategoryColor.value;

  if (!name) {
    alert("Please enter a category name");
    return;
  }

  const newCategory = {
    id: state.nextCategoryId++,
    name,
    type,
    color,
  };

  state.categories.push(newCategory);
  saveData();
  renderCategories();
  renderCategoryList();

  // Clear form
  elements.newCategoryName.value = "";
}

// Delete a category
function deleteCategory(id) {
  if (
    confirm(
      "Are you sure you want to delete this category? Transactions using this category will be set to uncategorized."
    )
  ) {
    // Update transactions with this category
    state.transactions.forEach((t) => {
      if (t.categoryId === id) {
        t.categoryId = null;
      }
    });

    // Remove category
    state.categories = state.categories.filter((c) => c.id !== id);
    saveData();
    renderCategories();
    renderCategoryList();
    renderTransactions();
    updateCharts();
  }
}

// Render category list in modal
function renderCategoryList() {
  elements.categoriesList.innerHTML = state.categories
    .map(
      (category) => `
                <div class="category-item">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <span>${category.name} (${category.type})</span>
                    <span class="delete-category" onclick="deleteCategory(${category.id})">×</span>
                </div>
            `
    )
    .join("");
}

// Update charts
function updateCharts() {
  updateIncomeExpenseChart();
  updateExpenseChart();
}

// Update income vs expense chart
function updateIncomeExpenseChart() {
  const ctx = elements.incomeExpenseChart.getContext("2d");

  // Group transactions by month
  const monthlyData = {};
  state.transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { income: 0, expense: 0 };
    }

    if (transaction.type === "income") {
      monthlyData[monthYear].income += transaction.amount;
    } else {
      monthlyData[monthYear].expense += transaction.amount;
    }
  });

  const labels = Object.keys(monthlyData).sort();
  const incomeData = labels.map((label) => monthlyData[label].income);
  const expenseData = labels.map((label) => monthlyData[label].expense);

  // Destroy existing chart if it exists
  if (window.incomeExpenseChartInstance) {
    window.incomeExpenseChartInstance.destroy();
  }

  window.incomeExpenseChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "rgba(40, 167, 69, 0.7)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 1,
        },
        {
          label: "Expenses",
          data: expenseData,
          backgroundColor: "rgba(247, 37, 133, 0.7)",
          borderColor: "rgba(247, 37, 133, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value;
            },
          },
        },
      },
    },
  });
}

// Update expense breakdown chart
function updateExpenseChart() {
  const ctx = elements.expenseChart.getContext("2d");

  // Calculate expenses by category
  const expenseByCategory = {};
  state.transactions
    .filter((t) => t.type === "expense")
    .forEach((transaction) => {
      const category = state.categories.find(
        (c) => c.id === transaction.categoryId
      );
      const categoryName = category ? category.name : "Uncategorized";
      const categoryColor = category ? category.color : "#6c757d";

      if (!expenseByCategory[categoryName]) {
        expenseByCategory[categoryName] = {
          amount: 0,
          color: categoryColor,
        };
      }

      expenseByCategory[categoryName].amount += transaction.amount;
    });

  const labels = Object.keys(expenseByCategory);
  const data = labels.map((label) => expenseByCategory[label].amount);
  const backgroundColors = labels.map(
    (label) => expenseByCategory[label].color
  );

  // Destroy existing chart if it exists
  if (window.expenseChartInstance) {
    window.expenseChartInstance.destroy();
  }

  window.expenseChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: $${value.toFixed(2)} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// Export data to CSV
function exportToCSV() {
  if (state.transactions.length === 0) {
    alert("No transactions to export");
    return;
  }

  const headers = [
    "Date",
    "Type",
    "Description",
    "Category",
    "Amount",
    "Notes",
  ];
  const csvContent = [
    headers.join(","),
    ...state.transactions.map((transaction) => {
      const category = state.categories.find(
        (c) => c.id === transaction.categoryId
      );
      const categoryName = category ? category.name : "Uncategorized";

      return [
        formatDate(transaction.date),
        transaction.type,
        `"${transaction.description.replace(/"/g, '""')}"`,
        `"${categoryName}"`,
        transaction.amount,
        `"${transaction.notes.replace(/"/g, '""')}"`,
      ].join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finance-tracker-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Make functions available globally for onclick handlers
window.deleteTransaction = deleteTransaction;
window.deleteCategory = deleteCategory;
