// Global variables
let recipesData = [];
let selectedCuisine = null;
const savedPerPage = 4;
let savedPage = 1;

// Get saved meals data from window (set by inline script in EJS)
const savedMealsData = window.savedMealsData || [];

// Cuisine options with emojis
const CUISINES = [
  { name: "Indian", emoji: "🍛" },
  { name: "Chinese", emoji: "🥡" },
  { name: "Italian", emoji: "🍝" },
  { name: "Mediterranean", emoji: "🥙" },
  { name: "Western", emoji: "🍔" },
  { name: "Japanese", emoji: "🍱" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Surprise Me!", emoji: "🎲" },
];

// DOM Ready handler
document.addEventListener("DOMContentLoaded", () => {
  renderCuisineTiles();
  renderSavedMeals();
  setupPaginationListeners();
});

// Recipe Search Functions
async function searchRecipes() {
  const checkboxes = document.querySelectorAll(".ingredient-checkbox:checked");
  const ingredients = Array.from(checkboxes).map((cb) => cb.value);
  if (ingredients.length === 0) {
    alert("Please select at least one ingredient");
    return;
  }

  // Show a page-level loading UI (reuse existing element if you have one)
  try {
    const response = await fetch(
      `/api/recipe-suggestions?ingredients=${ingredients.join(",")}`
    );
    const data = await response.json();
    if (data.success) {
      console.log("Fetched recipes:", data.recipes);
    } else {
      console.warn("No recipes returned");
    }
  } catch (err) {
    console.error("Error fetching recipes", err);
  }
}

// Cuisine Grid Functions
function renderCuisineTiles() {
  const cuisineGrid = document.getElementById("cuisineGrid");
  cuisineGrid.innerHTML = CUISINES.map(
    (c) => `<div class="cuisine-tile" data-cuisine="${c.name}">
              <div class="cuisine-content">
                <div class="cuisine-emoji">${c.emoji}</div>
                <div class="cuisine-name">${c.name}</div>
              </div>
            </div>`
  ).join("");

  cuisineGrid.querySelectorAll(".cuisine-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const cuisine = tile.dataset.cuisine;
      if (selectedCuisine === cuisine) {
        selectedCuisine = null;
        tile.classList.remove("selected");
      } else {
        selectedCuisine = cuisine;
        // update visual selection (simple single-select)
        cuisineGrid
          .querySelectorAll(".cuisine-tile")
          .forEach((t) => t.classList.toggle("selected", t === tile));
      }
    });
  });
}

function clearSelectedCuisine() {
  selectedCuisine = null;
  document
    .getElementById("cuisineGrid")
    .querySelectorAll(".cuisine-tile")
    .forEach((t) => t.classList.remove("selected"));
}

// AI Recipe Functions
function renderAIRecipeSnippet(recipe) {
  const title = recipe.title || recipe.name || "AI Meal";
  const ingredients =
    recipe.ingredients && recipe.ingredients.join
      ? recipe.ingredients.join(", ")
      : (recipe.usedIngredients || []).join(", ");
  const instructions =
    recipe.instructions ||
    (recipe.steps && recipe.steps.join(" ")) ||
    "Follow these ingredients and cook to taste.";
  const time = recipe.readyInMinutes || recipe.cookTime || "N/A";

  // encode recipe data safely
  const recipeSafe = encodeURIComponent(
    JSON.stringify({
      title,
      ingredients,
      instructions,
      time,
    })
  );

  return `
    <div class="recipe-preview">
      <h3 class="recipe-preview-title">${title}</h3>
      <div class="recipe-actions">
        <button class="btn btn-outline btn-sm view-btn" data-recipe="${recipeSafe}">View</button>
        <button class="btn btn-icon btn-sm save-btn" title="Save to favourites">❤️</button>
      </div>
    </div>
  `;
}

function attachAIRecipeEvents() {
  // View buttons
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const recipeData = JSON.parse(decodeURIComponent(btn.dataset.recipe));
      showModal(recipeData);
    });
  });

  // Save Recipe buttons (heart icon)
  document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      alert("Save recipe functionality - to be implemented");
    });
  });
}

async function generateRecipeWithAI() {
  const checkboxes = document.querySelectorAll(".ingredient-checkbox:checked");
  const ingredients = Array.from(checkboxes).map((cb) => cb.value);

  if (!ingredients.length) {
    return alert("Please select at least one ingredient");
  }

  if (!selectedCuisine) {
    return alert("Please select a cuisine style first");
  }

  // show loading
  document.getElementById("ai-content-top").style.display = "none";
  document.getElementById("ai-loading-top").style.display = "block";
  document.getElementById("ai-content-bottom").style.display = "none";
  document.getElementById("ai-loading-bottom").style.display = "block";

  try {
    const res = await fetch("/api/generate-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, cuisine: selectedCuisine }),
    });
    const data = await res.json();

    document.getElementById("ai-loading-bottom").style.display = "none";
    document.getElementById("ai-loading-top").style.display = "none";
    const r1 = data.recipes?.[0] || {};
    const r2 = data.recipes?.[1] || data.recipes?.[0] || {};

    document.getElementById("ai-content-bottom").style.display = "block";
    document.getElementById("ai-content-top").style.display = "block";
    document.getElementById("ai-content-bottom").innerHTML =
      renderAIRecipeSnippet(r2);
    document.getElementById("ai-content-top").innerHTML =
      renderAIRecipeSnippet(r1);

    attachAIRecipeEvents(); // attach button events for View / Save / Use
  } catch (err) {
    console.error(err);
    document.getElementById("ai-loading-bottom").style.display = "none";
    document.getElementById("ai-loading-top").style.display = "none";
    document.getElementById("ai-content-top").style.display = "block";
    document.getElementById("ai-content-bottom").style.display = "block";
    document.getElementById(
      "ai-content-top"
    ).innerHTML = `<p style="color:var(--danger)">Failed to generate. Try again later.</p>`;
    document.getElementById(
      "ai-content-bottom"
    ).innerHTML = `<p style="color:var(--danger)">Failed to generate. Try again later.</p>`;
  }
}

// Modal Functions
function showModal(recipe) {
  const modal = document.getElementById("aiModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalIngredients = document.getElementById("modalIngredients");

  modalTitle.textContent = recipe.title;

  // Format recipe details in sections
  modalIngredients.innerHTML = `
    <div class="recipe-modal-content">
      <div class="recipe-modal-header">
        <span class="recipe-time">⏱️ ${recipe.time} minutes</span>
      </div>

      <section class="recipe-section">
        <h4>🥗 Ingredients</h4>
        <ul class="ingredients-list">
          ${recipe.ingredients
            .split(",")
            .map((ingredient) => `<li>${ingredient.trim()}</li>`)
            .join("")}
        </ul>
      </section>

      <section class="recipe-section">
        <h4>📝 Instructions</h4>
        <div class="instructions-text">
          ${recipe.instructions
            .split(".")
            .filter((step) => step.trim())
            .map(
              (step, index) =>
                `<p class="instruction-step"><span class="step-number">${
                  index + 1
                }.</span> ${step.trim()}.</p>`
            )
            .join("")}
        </div>
      </section>
    </div>
  `;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("aiModal").style.display = "none";
}

// Saved Meals Functions
function renderSavedMeals() {
  const total = Math.max(1, Math.ceil(savedMealsData.length / savedPerPage));
  if (savedPage > total) savedPage = total;
  const start = (savedPage - 1) * savedPerPage;
  const items = savedMealsData.slice(start, start + savedPerPage);
  const savedGrid = document.getElementById("saved-grid");
  const savedPageEl = document.getElementById("savedPage");
  const savedTotalPagesEl = document.getElementById("savedTotalPages");

  savedGrid.innerHTML =
    items
      .map(
        (m) => `
    <div class="saved-card">
      <div>
        <div class="saved-card-title">${
          m.title || m.name || "Untitled Meal"
        }</div>
        <div class="saved-card-description">${
          m.summary || m.description || ""
        }</div>
      </div>
      <div class="saved-card-actions">
        <a href="/recipes/${m.id || ""}" class="btn btn-outline">View</a>
        <button onclick="useSavedRecipe('${
          m.id || ""
        }')" class="btn btn-primary">Use</button>
      </div>
    </div>
  `
      )
      .join("") || `<div class="no-recipes">No favourite recipes.</div>`;

  savedPageEl.textContent = savedPage;
  savedTotalPagesEl.textContent = total;
  document.getElementById("prevPageBtn").disabled = savedPage <= 1;
  document.getElementById("nextPageBtn").disabled = savedPage >= total;
}

function useSavedRecipe(id) {
  // placeholder - you can replace with actual behavior
  alert("Using saved recipe — ID: " + id);
}

// Pagination Event Listeners
function setupPaginationListeners() {
  document.getElementById("prevPageBtn").addEventListener("click", () => {
    if (savedPage > 1) {
      savedPage--;
      renderSavedMeals();
    }
  });

  document.getElementById("nextPageBtn").addEventListener("click", () => {
    const total = Math.max(1, Math.ceil(savedMealsData.length / savedPerPage));
    if (savedPage < total) {
      savedPage++;
      renderSavedMeals();
    }
  });
}
