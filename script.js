// API Configuration
const API_KEY = "dfd4a1f9e3804cbc8df4c18f5e5b78ae";
const BASE_URL = 'https://api.spoonacular.com/recipes';

// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const ingredientInput = document.getElementById('ingredientInput');
const dietFilter = document.getElementById('dietFilter');
const cuisineFilter = document.getElementById('cuisineFilter');
const mealTypeFilter = document.getElementById('mealTypeFilter');
const resultsGrid = document.getElementById('resultsGrid');
const favoritesGrid = document.getElementById('favoritesGrid');
const favoriteCount = document.getElementById('favoriteCount');
const loading = document.getElementById('loading');
const recipeModal = document.getElementById('recipeModal');
const closeModal = document.querySelector('.close');

// State
let currentRecipes = [];
let favorites = JSON.parse(localStorage.getItem('recipeFavorites')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    displayFavorites();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', searchRecipes);
    ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchRecipes();
    });
    closeModal.addEventListener('click', () => {
        recipeModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
    });
}

// Search Recipes Function
async function searchRecipes() {
    const ingredients = ingredientInput.value.trim();
    const diet = dietFilter.value;
    const cuisine = cuisineFilter.value;
    const mealType = mealTypeFilter.value;
    
    if (!ingredients) {
        alert('Please enter at least one ingredient');
        return;
    }
    
    // Show loading
    loading.style.display = 'block';
    resultsGrid.innerHTML = '';
    
    try {
        // Build query parameters
        let query = `apiKey=${API_KEY}&number=12&addRecipeInformation=true`;
        query += `&includeIngredients=${encodeURIComponent(ingredients)}`;
        
        if (diet) query += `&diet=${diet}`;
        if (cuisine) query += `&cuisine=${cuisine}`;
        if (mealType) query += `&type=${mealType}`;
        
        // Make API call
        const response = await fetch(`${BASE_URL}/complexSearch?${query}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        currentRecipes = data.results || [];
        
        // Display results
        displayRecipes(currentRecipes);
        
    } catch (error) {
        console.error('Error fetching recipes:', error);
        resultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading recipes. Please try again later.</p>
                <p><small>${error.message}</small></p>
            </div>
        `;
    } finally {
        loading.style.display = 'none';
    }
}

// Display Recipes
function displayRecipes(recipes) {
    if (recipes.length === 0) {
        resultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-utensils"></i>
                <p>No recipes found. Try different ingredients or filters.</p>
            </div>
        `;
        return;
    }
    
    resultsGrid.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" data-id="${recipe.id}">
            <button class="favorite-btn ${isFavorite(recipe.id) ? 'active' : ''}" 
                    onclick="toggleFavorite(${recipe.id})">
                <i class="fas fa-heart"></i>
            </button>
            <img src="${recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${recipe.title}" 
                 class="recipe-image">
            <div class="recipe-info">
                <h3 class="recipe-title">${recipe.title}</h3>
                <div class="recipe-meta">
                    <span><i class="fas fa-clock"></i> ${recipe.readyInMinutes || 'N/A'} min</span>
                    <span><i class="fas fa-users"></i> ${recipe.servings || 'N/A'} servings</span>
                </div>
                <button class="view-recipe" onclick="viewRecipeDetails(${recipe.id})">
                    View Recipe
                </button>
            </div>
        </div>
    `).join('');
}

// View Recipe Details
async function viewRecipeDetails(recipeId) {
    loading.style.display = 'block';
    
    try {
        const response = await fetch(`${BASE_URL}/${recipeId}/information?apiKey=${API_KEY}`);
        const recipe = await response.json();
        
        // Build modal content
        const modalContent = `
            <div class="recipe-details">
                <h2>${recipe.title}</h2>
                <img src="${recipe.image}" alt="${recipe.title}" style="width:100%; max-height:300px; object-fit:cover; border-radius:5px; margin:15px 0;">
                
                <div style="display:flex; gap:20px; margin:20px 0; flex-wrap:wrap;">
                    <div style="background:#f0f0f0; padding:10px 15px; border-radius:5px;">
                        <strong><i class="fas fa-clock"></i> Prep Time:</strong> ${recipe.readyInMinutes} minutes
                    </div>
                    <div style="background:#f0f0f0; padding:10px 15px; border-radius:5px;">
                        <strong><i class="fas fa-users"></i> Servings:</strong> ${recipe.servings}
                    </div>
                    <div style="background:#f0f0f0; padding:10px 15px; border-radius:5px;">
                        <strong><i class="fas fa-fire"></i> Calories:</strong> ${recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 'N/A'}
                    </div>
                </div>
                
                <div style="margin:25px 0;">
                    <h3><i class="fas fa-list"></i> Ingredients</h3>
                    <ul style="columns:2; margin-top:10px;">
                        ${recipe.extendedIngredients?.map(ing => `
                            <li style="margin-bottom:5px;">${ing.original}</li>
                        `).join('') || '<li>No ingredients listed</li>'}
                    </ul>
                </div>
                
                <div style="margin:25px 0;">
                    <h3><i class="fas fa-utensils"></i> Instructions</h3>
                    <div style="margin-top:10px;">
                        ${recipe.instructions 
                            ? recipe.instructions.replace(/\n/g, '<br>')
                            : 'No instructions available. Check the source link below.'}
                    </div>
                </div>
                
                <div style="margin-top:30px; text-align:center;">
                    <a href="${recipe.sourceUrl}" target="_blank" 
                       style="background:#4CAF50; color:white; padding:12px 25px; text-decoration:none; border-radius:5px; display:inline-block;">
                       View Full Recipe on ${recipe.sourceName || 'Original Site'}
                    </a>
                </div>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = modalContent;
        recipeModal.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        document.getElementById('modalContent').innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ff6b6b;"></i>
                <h3>Error Loading Recipe</h3>
                <p>${error.message}</p>
            </div>
        `;
        recipeModal.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Favorite Functions
function isFavorite(recipeId) {
    return favorites.includes(recipeId);
}

function toggleFavorite(recipeId) {
    const index = favorites.indexOf(recipeId);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(recipeId);
        showNotification('Added to favorites!');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        showNotification('Removed from favorites');
    }
    
    // Save to localStorage
    localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
    
    // Update UI
    displayFavorites();
    displayRecipes(currentRecipes);
}

function displayFavorites() {
    favoriteCount.textContent = `(${favorites.length})`;
    
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="empty-favorites">
                <i class="fas fa-heart"></i>
                <p>No favorite recipes yet. Click the heart icon to save some!</p>
            </div>
        `;
        return;
    }
    
    // For demo, show message - in real app, you'd fetch favorite recipes
    favoritesGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:30px; background:#fff; border-radius:10px; box-shadow:0 3px 10px rgba(0,0,0,0.1);">
            <i class="fas fa-heart" style="font-size:2.5rem; color:#ff6b6b; margin-bottom:15px;"></i>
            <h3>You have ${favorites.length} favorite recipes</h3>
            <p>Favorites are saved to your browser's local storage.</p>
            <p><small>In a full implementation, this would display your saved recipes.</small></p>
        </div>
    `;
}

// Notification Function
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);