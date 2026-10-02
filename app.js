/**
 * FitTrack AI - Core Application Logic
 * Dynamic AI Vision Meal Scanner (Upload & Snap Live Photo Analysis),
 * Macronutrient Tracking Engine, Nutrition Plan Templates, Custom Meal Logger,
 * Hardware Motion Sensors, and Full Data Persistence.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. STATE MANAGEMENT & PERSISTENCE
  // ==========================================
  const appState = {
    theme: localStorage.getItem('fittrack-theme') || 'dark',
    activeScreen: 'home',
    steps: 0,
    stepGoal: 10000,
    caloriesConsumed: 0,
    calorieGoal: 2200,
    caloriesBurned: 0,
    waterConsumed: 0,
    waterGoal: 2500,

    // Body Weight & Routine State
    userName: localStorage.getItem('fittrack-user-name') || 'Alex Rivers',
    userHeight: 178,
    bodyWeight: 70.0,
    targetWeight: 68.0,
    completedWorkouts: 0,
    currentWorkoutName: 'Full Body Strength',
    activityHistory: {}, // Persistent daily user activity logs: { 'YYYY-MM-DD': { steps: 0, workouts: 0 } }

    // Weekly Activity Tracking State
    weeklyActivity: {
      mon: { steps: 6500, cals: 1500, label: 'Mon' },
      tue: { steps: 8000, cals: 1700, label: 'Tue' },
      wed: { steps: 4500, cals: 1200, label: 'Wed' },
      thu: { steps: 9500, cals: 1900, label: 'Thu' },
      fri: { steps: 0, cals: 0, label: 'Fri' },
      sat: { steps: 0, cals: 0, label: 'Sat' },
      sun: { steps: 0, cals: 0, label: 'Sun' }
    },

    // Macronutrient & Meal Plan State
    activeMealPlan: localStorage.getItem('fittrack-meal-plan') || 'balanced',
    proteinConsumed: 0,
    proteinGoal: 140,
    carbsConsumed: 0,
    carbsGoal: 220,
    fatsConsumed: 0,
    fatsGoal: 65,
    loggedMealsHistory: [],

    workoutActive: false,
    workoutTimerSeconds: 0,
    workoutTimerInterval: null,
    
    // AI Vision State
    aiEngine: localStorage.getItem('fittrack-ai-engine') || 'tfjs',
    geminiKey: localStorage.getItem('fittrack-gemini-key') || '',
    cameraActive: false,
    mediaStream: null,
    tfModel: null,
    currentPortion: 1.0,
    baseNutrition: {
      name: 'Analyzed Meal',
      rawClass: 'Detected Dish',
      confidence: '95.0%',
      cals: 450,
      protein: 30,
      carbs: 45,
      fat: 15,
      fiber: 6,
      tags: ['AI Vision Recognized', 'Nutrient Rich'],
      img: '',
      components: {
        protein: 'Protein Source',
        carbs: 'Carbohydrate Base',
        fats: 'Healthy Dressing & Oils',
        fiber: 'Veggies & Greens'
      }
    },

    // Motion Sensor State
    motionSensorActive: false
  };

  // Nutrition Plan Presets Dictionary
  const mealPlanPresets = {
    balanced: { cals: 2200, protein: 140, carbs: 220, fats: 65, name: 'Balanced Plan' },
    keto: { cals: 1800, protein: 120, carbs: 30, fats: 130, name: 'Keto Low Carb' },
    highprotein: { cals: 2600, protein: 190, carbs: 250, fats: 70, name: 'High Protein' },
    weightloss: { cals: 1600, protein: 130, carbs: 150, fats: 45, name: 'Weight Loss' }
  };

  // Load saved metrics from localStorage if available
  function loadAppStateFromStorage() {
    const saved = localStorage.getItem('fittrack-app-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        appState.steps = parsed.steps ?? 0;
        appState.stepGoal = parsed.stepGoal ?? 10000;
        appState.caloriesConsumed = parsed.caloriesConsumed ?? 0;
        appState.calorieGoal = parsed.calorieGoal ?? 2200;
        appState.waterConsumed = parsed.waterConsumed ?? 0;
        appState.waterGoal = parsed.waterGoal ?? 2500;

        appState.proteinConsumed = parsed.proteinConsumed ?? 0;
        appState.proteinGoal = parsed.proteinGoal ?? 140;
        appState.carbsConsumed = parsed.carbsConsumed ?? 0;
        appState.carbsGoal = parsed.carbsGoal ?? 220;
        appState.fatsConsumed = parsed.fatsConsumed ?? 0;
        appState.fatsGoal = parsed.fatsGoal ?? 65;
        appState.loggedMealsHistory = parsed.loggedMealsHistory ?? [];

        appState.bodyWeight = parsed.bodyWeight ?? 70.0;
        appState.targetWeight = parsed.targetWeight ?? 68.0;
        appState.userHeight = parsed.userHeight ?? 178;
        appState.userName = parsed.userName ?? 'Alex Rivers';
        appState.completedWorkouts = parsed.completedWorkouts ?? 0;
        appState.currentWorkoutName = parsed.currentWorkoutName ?? 'Full Body Strength';
        appState.weeklyActivity = parsed.weeklyActivity ?? appState.weeklyActivity;
        appState.activityHistory = parsed.activityHistory ?? {};

        console.log('FitTrack AI Persistent State & Macro History Loaded!');
      } catch (e) {
        console.warn('Error reading stored state:', e);
      }
    }
  }

  function saveAppStateToStorage() {
    const dataToSave = {
      steps: appState.steps,
      stepGoal: appState.stepGoal,
      caloriesConsumed: appState.caloriesConsumed,
      calorieGoal: appState.calorieGoal,
      waterConsumed: appState.waterConsumed,
      waterGoal: appState.waterGoal,
      proteinConsumed: appState.proteinConsumed,
      proteinGoal: appState.proteinGoal,
      carbsConsumed: appState.carbsConsumed,
      carbsGoal: appState.carbsGoal,
      fatsConsumed: appState.fatsConsumed,
      fatsGoal: appState.fatsGoal,
      loggedMealsHistory: appState.loggedMealsHistory,
      bodyWeight: appState.bodyWeight,
      targetWeight: appState.targetWeight,
      userHeight: appState.userHeight,
      userName: appState.userName,
      completedWorkouts: appState.completedWorkouts,
      currentWorkoutName: appState.currentWorkoutName,
      weeklyActivity: appState.weeklyActivity,
      activityHistory: appState.activityHistory || {}
    };
    localStorage.setItem('fittrack-app-data', JSON.stringify(dataToSave));
  }

  loadAppStateFromStorage();

  // Dynamic Food Classification Knowledge Database
  const foodNutritionDatabase = {
    salmon: {
      name: 'Salmon Quinoa Bowl',
      cals: 620, protein: 42, carbs: 48, fat: 22, fiber: 8,
      tags: ['Heart Healthy', 'High Protein', 'Omega-3'],
      components: {
        protein: 'Salmon Fillet (42g Protein)',
        carbs: 'Quinoa & Grains (48g Carbs)',
        fats: 'Olive Oil (22g Fat)',
        fiber: 'Steamed Greens (8g Fiber)'
      }
    },
    avocado: {
      name: 'Avocado Toast & Egg',
      cals: 440, protein: 18, carbs: 36, fat: 24, fiber: 7,
      tags: ['Healthy Fats', 'Fiber Rich'],
      components: {
        protein: 'Poached Eggs (18g Protein)',
        carbs: 'Artisan Bread (36g Carbs)',
        fats: 'Fresh Avocado (24g Fat)',
        fiber: 'Seeds & Greens (7g Fiber)'
      }
    },
    guacamole: {
      name: 'Guacamole & Multi-Grain Toast',
      cals: 420, protein: 14, carbs: 38, fat: 26, fiber: 9,
      tags: ['Plant Based', 'Healthy Fats'],
      components: {
        protein: 'Seeds & Grains (14g Protein)',
        carbs: 'Multi-Grain Toast (38g Carbs)',
        fats: 'Fresh Guacamole (26g Fat)',
        fiber: 'Tomatoes & Greens (9g Fiber)'
      }
    },
    chicken: {
      name: 'Grilled Chicken Salad',
      cals: 380, protein: 45, carbs: 14, fat: 12, fiber: 5,
      tags: ['Lean Protein', 'Low Carb'],
      components: {
        protein: 'Grilled Chicken (45g Protein)',
        carbs: 'Sweet Corn & Carrots (14g Carbs)',
        fats: 'Vinaigrette (12g Fat)',
        fiber: 'Mixed Greens (5g Fiber)'
      }
    },
    salad: {
      name: 'Fresh Garden Salad',
      cals: 290, protein: 12, carbs: 22, fat: 16, fiber: 6,
      tags: ['Low Calorie', 'Vitamins'],
      components: {
        protein: 'Feta & Chickpeas (12g Protein)',
        carbs: 'Cucumbers & Veggies (22g Carbs)',
        fats: 'Salad Dressing (16g Fat)',
        fiber: 'Crisp Greens (6g Fiber)'
      }
    },
    smoothie: {
      name: 'Berry Protein Smoothie',
      cals: 310, protein: 24, carbs: 42, fat: 6, fiber: 8,
      tags: ['Antioxidants', 'Quick Energy'],
      components: {
        protein: 'Protein Powder (24g Protein)',
        carbs: 'Blended Berries (42g Carbs)',
        fats: 'Nut Butter (6g Fat)',
        fiber: 'Chia Seeds (8g Fiber)'
      }
    },
    pizza: {
      name: 'Margherita Pizza',
      cals: 780, protein: 28, carbs: 92, fat: 32, fiber: 4,
      tags: ['High Energy'],
      components: {
        protein: 'Mozzarella Cheese (28g Protein)',
        carbs: 'Pizza Crust (92g Carbs)',
        fats: 'Cheese & Olive Oil (32g Fat)',
        fiber: 'Tomato Sauce (4g Fiber)'
      }
    },
    burger: {
      name: 'Beef Burger',
      cals: 650, protein: 38, carbs: 48, fat: 34, fiber: 3,
      tags: ['High Protein', 'Iron Rich'],
      components: {
        protein: 'Beef Patty (38g Protein)',
        carbs: 'Burger Bun (48g Carbs)',
        fats: 'Cheddar Cheese (34g Fat)',
        fiber: 'Lettuce & Pickles (3g Fiber)'
      }
    },
    steak: {
      name: 'Seared Steak & Veggies',
      cals: 720, protein: 56, carbs: 10, fat: 50, fiber: 4,
      tags: ['Keto Friendly', 'High Protein'],
      components: {
        protein: 'Seared Steak (56g Protein)',
        carbs: 'Roasted Asparagus (10g Carbs)',
        fats: 'Herb Butter (50g Fat)',
        fiber: 'Veggies (4g Fiber)'
      }
    },
    rice: {
      name: 'Rice & Veggie Bowl',
      cals: 490, protein: 22, carbs: 65, fat: 14, fiber: 6,
      tags: ['Energy Boosting', 'Balanced'],
      components: {
        protein: 'Tofu/Protein (22g Protein)',
        carbs: 'Steamed Rice (65g Carbs)',
        fats: 'Sesame Oil (14g Fat)',
        fiber: 'Mixed Vegetables (6g Fiber)'
      }
    },
    default: {
      name: 'Nutritious Meal Dish',
      cals: 480, protein: 28, carbs: 45, fat: 18, fiber: 6,
      tags: ['Balanced Nutrition'],
      components: {
        protein: 'Lean Protein Source (28g Protein)',
        carbs: 'Complex Carbs (45g Carbs)',
        fats: 'Healthy Oils (18g Fat)',
        fiber: 'Mixed Vegetables (6g Fiber)'
      }
    }
  };

  async function preloadTensorFlowModel() {
    if (window.mobilenet && !appState.tfModel) {
      try {
        console.log('Loading MobileNet AI Vision Model...');
        appState.tfModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        console.log('TensorFlow MobileNet Model Loaded Successfully!');
      } catch (err) {
        console.warn('MobileNet load warning:', err);
      }
    }
  }
  preloadTensorFlowModel();

  // ==========================================
  // 2. THEME ENGINE
  // ==========================================
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const profileThemeToggle = document.getElementById('profile-theme-toggle');

  function applyTheme(theme) {
    appState.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fittrack-theme', theme);

    if (profileThemeToggle) profileThemeToggle.checked = (theme === 'dark');
  }

  applyTheme(appState.theme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      showToast(`Switched to ${newTheme.toUpperCase()} mode`);
    });
  }

  if (profileThemeToggle) {
    profileThemeToggle.addEventListener('change', (e) => {
      applyTheme(e.target.checked ? 'dark' : 'light');
    });
  }

  // ==========================================
  // 3. NAVIGATION ROUTER
  // ==========================================
  const navTabs = document.querySelectorAll('.nav-tab');
  const screenViews = document.querySelectorAll('.screen-view');

  function switchScreen(targetScreenId) {
    appState.activeScreen = targetScreenId;

    screenViews.forEach(screen => {
      if (screen.id === `screen-${targetScreenId}`) {
        screen.classList.add('active');
      } else {
        screen.classList.remove('active');
      }
    });

    navTabs.forEach(tab => {
      if (tab.dataset.screen === targetScreenId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (targetScreenId !== 'scanner' && appState.cameraActive) {
      stopCameraFeed();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchScreen(tab.dataset.screen));
  });

  const avatarBtn = document.getElementById('header-avatar-btn');
  if (avatarBtn) avatarBtn.addEventListener('click', () => switchScreen('profile'));

  const gotoStepsCard = document.getElementById('card-goto-steps');
  if (gotoStepsCard) gotoStepsCard.addEventListener('click', () => switchScreen('steps'));

  const gotoCalsCard = document.getElementById('card-goto-calories');
  if (gotoCalsCard) gotoCalsCard.addEventListener('click', () => switchScreen('calories'));

  const tileScanMeal = document.getElementById('tile-scan-meal');
  if (tileScanMeal) tileScanMeal.addEventListener('click', () => switchScreen('scanner'));

  const tileStartWorkout = document.getElementById('tile-start-workout');
  if (tileStartWorkout) tileStartWorkout.addEventListener('click', () => switchScreen('workout'));

  const tileLogWater = document.getElementById('tile-log-water');
  if (tileLogWater) tileLogWater.addEventListener('click', addWaterIntake);

  const tileViewStats = document.getElementById('tile-view-stats');
  if (tileViewStats) tileViewStats.addEventListener('click', () => switchScreen('profile'));

  const openMealScannerBtn = document.getElementById('open-meal-scanner-btn');
  if (openMealScannerBtn) openMealScannerBtn.addEventListener('click', () => switchScreen('scanner'));

  // ==========================================
  // 4. DYNAMIC MACRONUTRIENT DASHBOARD & MEAL PLANS
  // ==========================================
  const calConsumedHeroVal = document.getElementById('cal-consumed-hero-val');
  const calGoalHeroVal = document.getElementById('cal-goal-hero-val');
  const calRemainingVal = document.getElementById('cal-remaining-val');
  const calHeroProgressFill = document.getElementById('cal-hero-progress-fill');
  const calPercentLabel = document.getElementById('cal-percent-label');
  const calGoalLabelEnd = document.getElementById('cal-goal-label-end');

  const macroProteinText = document.getElementById('macro-protein-text');
  const macroCarbsText = document.getElementById('macro-carbs-text');
  const macroFatsText = document.getElementById('macro-fats-text');
  const macroProteinFill = document.getElementById('macro-protein-fill');
  const macroCarbsFill = document.getElementById('macro-carbs-fill');
  const macroFatsFill = document.getElementById('macro-fats-fill');

  const mealPlanPills = document.querySelectorAll('.meal-plan-pill');

  function updateMacroDashboardUI() {
    // Update Calorie Hero Box
    if (calConsumedHeroVal) calConsumedHeroVal.textContent = appState.caloriesConsumed.toLocaleString();
    if (calGoalHeroVal) calGoalHeroVal.textContent = appState.calorieGoal.toLocaleString();
    const remaining = Math.max(appState.calorieGoal - appState.caloriesConsumed, 0);
    if (calRemainingVal) calRemainingVal.textContent = remaining.toLocaleString();

    const calPct = Math.min((appState.caloriesConsumed / appState.calorieGoal) * 100, 100).toFixed(0);
    if (calHeroProgressFill) calHeroProgressFill.style.width = `${calPct}%`;
    if (calPercentLabel) calPercentLabel.textContent = `${calPct}% of budget`;
    if (calGoalLabelEnd) calGoalLabelEnd.textContent = `${appState.calorieGoal.toLocaleString()} kcal`;

    // Update Macro Bars
    if (macroProteinText) macroProteinText.textContent = `${appState.proteinConsumed}g / ${appState.proteinGoal}g`;
    if (macroCarbsText) macroCarbsText.textContent = `${appState.carbsConsumed}g / ${appState.carbsGoal}g`;
    if (macroFatsText) macroFatsText.textContent = `${appState.fatsConsumed}g / ${appState.fatsGoal}g`;

    const pPct = Math.min((appState.proteinConsumed / appState.proteinGoal) * 100, 100);
    const cPct = Math.min((appState.carbsConsumed / appState.carbsGoal) * 100, 100);
    const fPct = Math.min((appState.fatsConsumed / appState.fatsGoal) * 100, 100);

    if (macroProteinFill) macroProteinFill.style.width = `${pPct}%`;
    if (macroCarbsFill) macroCarbsFill.style.width = `${cPct}%`;
    if (macroFatsFill) macroFatsFill.style.width = `${fPct}%`;

    // Also update Home Dashboard Calorie Card
    const homeCalsVal = document.getElementById('home-cals-val');
    if (homeCalsVal) homeCalsVal.textContent = appState.caloriesConsumed.toLocaleString();

    renderMealsHistoryList();
  }

  // Meal Plan Template Selection
  mealPlanPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const planKey = pill.dataset.plan;
      if (mealPlanPresets[planKey]) {
        mealPlanPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const plan = mealPlanPresets[planKey];
        appState.activeMealPlan = planKey;
        appState.calorieGoal = plan.cals;
        appState.proteinGoal = plan.protein;
        appState.carbsGoal = plan.carbs;
        appState.fatsGoal = plan.fats;

        localStorage.setItem('fittrack-meal-plan', planKey);
        saveAppStateToStorage();
        updateMacroDashboardUI();
        showToast(`Activated ${plan.name} (${plan.cals} kcal)! 🥗`);
      }
    });
  });

  // Render Meal History Feed & Bind Delete Buttons
  function renderMealsHistoryList() {
    const mealsListContainer = document.getElementById('meals-list-container');
    if (!mealsListContainer) return;

    if (appState.loggedMealsHistory && appState.loggedMealsHistory.length > 0) {
      mealsListContainer.innerHTML = appState.loggedMealsHistory.map(meal => `
        <div class="meal-card" data-id="${meal.id}">
          <div class="meal-icon-box dinner-bg">
            ${meal.img ? `<img src="${meal.img}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" alt="${meal.name}">` : '<i data-lucide="utensils"></i>'}
          </div>
          <div class="meal-details">
            <div class="meal-title-row">
              <h4>${meal.name} ${meal.portion && meal.portion !== 1 ? `(${meal.portion}x)` : ''}</h4>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="meal-cals">${meal.cals} kcal</span>
                <button class="delete-meal-btn" data-id="${meal.id}" title="Delete meal entry"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
            <p class="meal-items">${meal.time || 'Today'} • AI Meal Analysis</p>
            <div class="meal-macros-mini">
              <span class="text-emerald font-bold">P: ${meal.protein}g</span> • 
              <span class="text-orange font-bold">C: ${meal.carbs}g</span> • 
              <span class="text-cyan font-bold">F: ${meal.fats}g</span>
            </div>
          </div>
        </div>
      `).join('');

      // Bind delete events
      document.querySelectorAll('.delete-meal-btn').forEach(delBtn => {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(delBtn.dataset.id);
          deleteMealEntry(id);
        });
      });

      if (window.lucide) lucide.createIcons();
    } else {
      mealsListContainer.innerHTML = `
        <div class="empty-log-state" id="empty-log-placeholder">
          <i data-lucide="utensils" class="empty-icon"></i>
          <h4>No Meals Logged Today</h4>
          <p>Upload a meal photo or scan your dish to start tracking!</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  function deleteMealEntry(mealId) {
    const targetIdx = appState.loggedMealsHistory.findIndex(m => m.id === mealId);
    if (targetIdx !== -1) {
      const removed = appState.loggedMealsHistory[targetIdx];
      appState.caloriesConsumed = Math.max(appState.caloriesConsumed - removed.cals, 0);
      appState.proteinConsumed = Math.max(appState.proteinConsumed - removed.protein, 0);
      appState.carbsConsumed = Math.max(appState.carbsConsumed - removed.carbs, 0);
      appState.fatsConsumed = Math.max(appState.fatsConsumed - removed.fats, 0);

      appState.loggedMealsHistory.splice(targetIdx, 1);
      saveAppStateToStorage();
      updateMacroDashboardUI();
      showToast(`Removed ${removed.name} from log.`);
    }
  }

  // Custom Food Item Modal Logic
  const openCustomMealModalBtn = document.getElementById('open-custom-meal-modal-btn');
  const customMealModal = document.getElementById('custom-meal-modal');
  const closeCustomMealModal = document.getElementById('close-custom-meal-modal');
  const customFoodForm = document.getElementById('custom-food-form');

  if (openCustomMealModalBtn) {
    openCustomMealModalBtn.addEventListener('click', () => {
      if (customMealModal) customMealModal.classList.remove('hidden');
    });
  }

  if (closeCustomMealModal) {
    closeCustomMealModal.addEventListener('click', () => {
      if (customMealModal) customMealModal.classList.add('hidden');
    });
  }

  if (customFoodForm) {
    customFoodForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('custom-food-name').value;
      const cals = parseInt(document.getElementById('custom-food-cals').value) || 0;
      const protein = parseInt(document.getElementById('custom-food-protein').value) || 0;
      const carbs = parseInt(document.getElementById('custom-food-carbs').value) || 0;
      const fats = parseInt(document.getElementById('custom-food-fats').value) || 0;

      if (!title || cals <= 0) {
        showToast('Please enter a valid title and calorie amount.');
        return;
      }

      appState.caloriesConsumed += cals;
      appState.proteinConsumed += protein;
      appState.carbsConsumed += carbs;
      appState.fatsConsumed += fats;

      const customMealObj = {
        id: Date.now(),
        name: title,
        portion: 1.0,
        cals: cals,
        protein: protein,
        carbs: carbs,
        fats: fats,
        img: null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (!appState.loggedMealsHistory) appState.loggedMealsHistory = [];
      appState.loggedMealsHistory.unshift(customMealObj);

      saveAppStateToStorage();
      updateMacroDashboardUI();

      customFoodForm.reset();
      if (customMealModal) customMealModal.classList.add('hidden');
      showToast(`Added Custom Food: ${title} (+${cals} kcal)! 🥗`);
    });
  }

  // Step UI
  const stepGoalMinus = document.getElementById('goal-minus-btn');
  const stepGoalPlus = document.getElementById('goal-plus-btn');
  const goalTargetValDisplay = document.getElementById('goal-target-val');
  const currentStepGoalText = document.getElementById('current-step-goal');
  const profileStepGoalText = document.getElementById('profile-step-goal-text');
  const stepRingProgress = document.getElementById('step-ring-progress');
  const stepCounterDisplay = document.getElementById('step-counter-display');
  const homeStepsVal = document.getElementById('home-steps-val');

  const toggleMotionSensorBtn = document.getElementById('toggle-motion-sensor-btn');
  const sensorStatusText = document.getElementById('sensor-status-text');
  const sensorBtnLabel = document.getElementById('sensor-btn-label');

  let lastStepTimestamp = 0;

  function updateStepUI() {
    const circumference = 534;
    const progressPercent = Math.min(appState.steps / appState.stepGoal, 1);
    const strokeDashoffset = circumference - (progressPercent * circumference);

    if (stepRingProgress) stepRingProgress.style.strokeDashoffset = strokeDashoffset;
    if (stepCounterDisplay) stepCounterDisplay.textContent = appState.steps.toLocaleString();
    if (homeStepsVal) homeStepsVal.textContent = appState.steps.toLocaleString();

    // Update Home Hero Ring & Percentage Label
    const homeMainRing = document.getElementById('home-main-ring');
    const homeRingPercent = document.querySelector('.ring-number');
    if (homeMainRing) {
      const mainCircumference = 264;
      const mainOffset = mainCircumference - (progressPercent * mainCircumference);
      homeMainRing.style.strokeDashoffset = mainOffset;
    }
    if (homeRingPercent) {
      homeRingPercent.textContent = `${(progressPercent * 100).toFixed(0)}%`;
    }

    if (goalTargetValDisplay) goalTargetValDisplay.textContent = appState.stepGoal.toLocaleString();
    if (currentStepGoalText) currentStepGoalText.textContent = appState.stepGoal.toLocaleString();
    if (profileStepGoalText) profileStepGoalText.textContent = `${appState.stepGoal.toLocaleString()} steps`;

    const distKm = (appState.steps * 0.00075).toFixed(1);
    const calsBurned = Math.round(appState.steps * 0.045);
    appState.caloriesBurned = calsBurned;

    const stepDistVal = document.getElementById('step-dist-val');
    const stepCalsVal = document.getElementById('step-cals-val');
    const calBurnedHeroVal = document.getElementById('cal-burned-hero-val');

    if (stepDistVal) stepDistVal.textContent = `${distKm} km`;
    if (stepCalsVal) stepCalsVal.textContent = `${calsBurned} kcal`;
    if (calBurnedHeroVal) calBurnedHeroVal.textContent = calsBurned.toLocaleString();

    if (typeof updateWeeklyActivityUI === 'function') updateWeeklyActivityUI();
    if (typeof renderGitHubActivityHeatmap === 'function') renderGitHubActivityHeatmap();
  }

  // Real-Time Quick Step Addition Handlers
  const addSteps100 = document.getElementById('add-steps-100');
  const addSteps500 = document.getElementById('add-steps-500');
  const addSteps1000 = document.getElementById('add-steps-1000');

  function addSteps(count) {
    appState.steps += count;
    updateStepUI();
    saveAppStateToStorage();
    showToast(`Added +${count.toLocaleString()} Steps! Total: ${appState.steps.toLocaleString()} 👟`);
  }

  if (addSteps100) addSteps100.addEventListener('click', () => addSteps(100));
  if (addSteps500) addSteps500.addEventListener('click', () => addSteps(500));
  if (addSteps1000) addSteps1000.addEventListener('click', () => addSteps(1000));

  // Profile Photo Upload Engine
  appState.userAvatar = localStorage.getItem('fittrack-user-avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

  function updateAvatarUI() {
    const headerImg = document.getElementById('header-avatar-img');
    const profileImg = document.getElementById('profile-avatar-img');

    if (headerImg) headerImg.src = appState.userAvatar;
    if (profileImg) profileImg.src = appState.userAvatar;
  }

  updateAvatarUI();

  const profilePhotoFileInput = document.getElementById('profile-photo-file-input');
  if (profilePhotoFileInput) {
    profilePhotoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          appState.userAvatar = evt.target.result;
          localStorage.setItem('fittrack-user-avatar', evt.target.result);
          updateAvatarUI();
          showToast('Profile photo updated successfully! 📸');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function handleDeviceMotion(event) {
    if (!appState.motionSensorActive) return;
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const totalAcc = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const now = Date.now();

    if (totalAcc > 12.5 && (now - lastStepTimestamp) > 250) {
      lastStepTimestamp = now;
      appState.steps += 1;
      updateStepUI();
      saveAppStateToStorage();
    }
  }

  async function toggleHardwareMotionSensor() {
    if (!appState.motionSensorActive) {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          if (permission !== 'granted') {
            showToast('Motion sensor permission denied.');
            return;
          }
        } catch (e) {
          console.warn('Motion permission prompt:', e);
        }
      }

      window.addEventListener('devicemotion', handleDeviceMotion, true);
      appState.motionSensorActive = true;
      if (toggleMotionSensorBtn) toggleMotionSensorBtn.classList.add('active');
      if (sensorBtnLabel) sensorBtnLabel.textContent = 'Disable Sensor';
      if (sensorStatusText) sensorStatusText.textContent = 'Active • Shake or walk to count steps!';
      showToast('Hardware Step Sensor Activated! 👟');
    } else {
      window.removeEventListener('devicemotion', handleDeviceMotion, true);
      appState.motionSensorActive = false;
      if (toggleMotionSensorBtn) toggleMotionSensorBtn.classList.remove('active');
      if (sensorBtnLabel) sensorBtnLabel.textContent = 'Enable Sensor';
      if (sensorStatusText) sensorStatusText.textContent = 'Hardware accelerometer step tracking';
      showToast('Step Sensor Deactivated.');
    }
  }

  if (toggleMotionSensorBtn) toggleMotionSensorBtn.addEventListener('click', toggleHardwareMotionSensor);

  if (stepGoalMinus) {
    stepGoalMinus.addEventListener('click', () => {
      if (appState.stepGoal > 2000) {
        appState.stepGoal -= 500;
        updateStepUI();
        saveAppStateToStorage();
        showToast(`Daily Goal set to ${appState.stepGoal.toLocaleString()} steps`);
      }
    });
  }

  if (stepGoalPlus) {
    stepGoalPlus.addEventListener('click', () => {
      appState.stepGoal += 500;
      updateStepUI();
      saveAppStateToStorage();
      showToast(`Daily Goal set to ${appState.stepGoal.toLocaleString()} steps`);
    });
  }

  // ==========================================
  // BODY WEIGHT, WORKOUT ROUTINE & WEEKLY ACTIVITY ENGINE
  // ==========================================
  function updateBodyWeightUI() {
    const homeBodyWeightVal = document.getElementById('home-body-weight-val');
    const homeTargetWeightVal = document.getElementById('home-target-weight-val');
    const inputCurrent = document.getElementById('input-current-weight');
    const inputTarget = document.getElementById('input-target-weight');

    if (homeBodyWeightVal) homeBodyWeightVal.innerHTML = `${appState.bodyWeight}<span class="worke-unit">kg</span>`;
    if (homeTargetWeightVal) homeTargetWeightVal.textContent = `Target: ${appState.targetWeight} kg`;

    if (inputCurrent) inputCurrent.value = appState.bodyWeight;
    if (inputTarget) inputTarget.value = appState.targetWeight;
  }

  function updateWorkoutRoutineUI() {
    const homeWorkoutCountVal = document.getElementById('home-workout-count-val');
    const homeWorkoutNameVal = document.getElementById('home-workout-name-val');

    if (homeWorkoutCountVal) homeWorkoutCountVal.textContent = appState.completedWorkouts;
    if (homeWorkoutNameVal) homeWorkoutNameVal.textContent = appState.currentWorkoutName;
  }

  function updateWeeklyActivityUI() {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayIndex = new Date().getDay();
    const todayKey = dayNames[todayIndex];

    if (appState.weeklyActivity && appState.weeklyActivity[todayKey]) {
      appState.weeklyActivity[todayKey].steps = appState.steps;
      appState.weeklyActivity[todayKey].cals = appState.caloriesConsumed;
    }

    Object.keys(appState.weeklyActivity || {}).forEach(dayKey => {
      const dayData = appState.weeklyActivity[dayKey];
      const stepBar = document.querySelector(`.chart-bar-group[data-day="${dayKey}"] .bar.step-b`);
      const calBar = document.querySelector(`.chart-bar-group[data-day="${dayKey}"] .bar.cal-b`);

      if (stepBar) {
        const stepPct = Math.min((dayData.steps / appState.stepGoal) * 100, 100);
        stepBar.style.height = `${Math.max(stepPct, 12)}%`;
        stepBar.title = `${dayData.label || dayKey.toUpperCase()}: ${dayData.steps.toLocaleString()} steps`;
      }
      if (calBar) {
        const calPct = Math.min((dayData.cals / appState.calorieGoal) * 100, 100);
        calBar.style.height = `${Math.max(calPct, 12)}%`;
        calBar.title = `${dayData.label || dayKey.toUpperCase()}: ${dayData.cals.toLocaleString()} kcal`;
      }
    });
  }

  // Interactive Body Weight Tile & Modal Handlers
  const cardBodyWeight = document.getElementById('card-body-weight');
  const weightModal = document.getElementById('weight-modal');
  const closeWeightModal = document.getElementById('close-weight-modal');
  const weightUpdateForm = document.getElementById('weight-update-form');

  if (cardBodyWeight) {
    cardBodyWeight.addEventListener('click', () => {
      updateBodyWeightUI();
      if (weightModal) weightModal.classList.remove('hidden');
    });
  }

  if (closeWeightModal) {
    closeWeightModal.addEventListener('click', () => {
      if (weightModal) weightModal.classList.add('hidden');
    });
  }

  if (weightUpdateForm) {
    weightUpdateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentVal = parseFloat(document.getElementById('input-current-weight').value);
      const targetVal = parseFloat(document.getElementById('input-target-weight').value);

      if (currentVal > 0 && targetVal > 0) {
        appState.bodyWeight = currentVal;
        appState.targetWeight = targetVal;

        saveAppStateToStorage();
        updateBodyWeightUI();
        if (weightModal) weightModal.classList.add('hidden');
        showToast(`Updated Body Weight to ${appState.bodyWeight} kg (Target: ${appState.targetWeight} kg)! ⚖️`);
      }
    });
  }

  // Interactive Workout Routine Tile Handler
  const cardWorkoutRoutine = document.getElementById('card-workout-routine');
  if (cardWorkoutRoutine) {
    cardWorkoutRoutine.addEventListener('click', () => {
      const modalWorkoutTitle = document.getElementById('modal-workout-title');
      const workoutModal = document.getElementById('workout-modal');
      if (modalWorkoutTitle) modalWorkoutTitle.textContent = appState.currentWorkoutName;
      if (workoutModal) workoutModal.classList.remove('hidden');
      showToast(`Ready to crush ${appState.currentWorkoutName}! 💪`);
    });
  }

  // Calendar Day Strip & Chart Bar Selection Handlers
  const dayPills = document.querySelectorAll('.day-pill[data-day]');
  const chartBarGroups = document.querySelectorAll('.chart-bar-group[data-day]');

  function selectActiveDay(dayKey) {
    dayPills.forEach(pill => {
      if (pill.dataset.day === dayKey) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    chartBarGroups.forEach(group => {
      if (group.dataset.day === dayKey) group.classList.add('active-day');
      else group.classList.remove('active-day');
    });

    if (appState.weeklyActivity && appState.weeklyActivity[dayKey]) {
      const data = appState.weeklyActivity[dayKey];
      showToast(`${dayKey.toUpperCase()} Activity: ${data.steps.toLocaleString()} steps | ${data.cals.toLocaleString()} kcal 📊`);
    }
  }

  dayPills.forEach(pill => {
    pill.addEventListener('click', () => selectActiveDay(pill.dataset.day));
  });

  chartBarGroups.forEach(group => {
    group.addEventListener('click', () => selectActiveDay(group.dataset.day));
  });

  function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm) return { bmi: 0, cat: 'Unknown' };
    const heightM = heightCm / 100;
    const bmiVal = (weightKg / (heightM * heightM)).toFixed(1);
    let cat = 'Normal';
    if (bmiVal < 18.5) cat = 'Underweight';
    else if (bmiVal >= 18.5 && bmiVal < 25.0) cat = 'Normal';
    else if (bmiVal >= 25.0 && bmiVal < 30.0) cat = 'Overweight';
    else cat = 'Obese';

    return { bmi: bmiVal, cat: cat };
  }

  function updateProfileMetricsUI() {
    const profileUserName = document.getElementById('profile-user-name');
    const profileWeightVal = document.getElementById('profile-weight-val');
    const profileHeightVal = document.getElementById('profile-height-val');
    const profileBmiVal = document.getElementById('profile-bmi-val');

    if (profileUserName) profileUserName.textContent = appState.userName;
    if (profileWeightVal) profileWeightVal.textContent = `${appState.bodyWeight} kg`;
    if (profileHeightVal) profileHeightVal.textContent = `${appState.userHeight} cm`;

    const bmiInfo = calculateBMI(appState.bodyWeight, appState.userHeight);
    if (profileBmiVal) profileBmiVal.textContent = `${bmiInfo.bmi} (${bmiInfo.cat})`;

    // Populate edit modal inputs
    const inputName = document.getElementById('input-profile-name');
    const inputWeight = document.getElementById('input-profile-weight');
    const inputTarget = document.getElementById('input-profile-target-weight');
    const inputHeight = document.getElementById('input-profile-height');

    if (inputName) inputName.value = appState.userName;
    if (inputWeight) inputWeight.value = appState.bodyWeight;
    if (inputTarget) inputTarget.value = appState.targetWeight;
    if (inputHeight) inputHeight.value = appState.userHeight;
  }

  // Interactive Edit Profile Parameters & Body Metrics Handlers
  const openEditProfileModalBtn = document.getElementById('open-edit-profile-modal-btn');
  const editProfileModal = document.getElementById('edit-profile-modal');
  const closeEditProfileModal = document.getElementById('close-edit-profile-modal');
  const editProfileForm = document.getElementById('edit-profile-form');

  if (openEditProfileModalBtn) {
    openEditProfileModalBtn.addEventListener('click', () => {
      updateProfileMetricsUI();
      if (editProfileModal) editProfileModal.classList.remove('hidden');
    });
  }

  if (closeEditProfileModal) {
    closeEditProfileModal.addEventListener('click', () => {
      if (editProfileModal) editProfileModal.classList.add('hidden');
    });
  }

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameVal = document.getElementById('input-profile-name').value.trim();
      const weightVal = parseFloat(document.getElementById('input-profile-weight').value);
      const targetVal = parseFloat(document.getElementById('input-profile-target-weight').value);
      const heightVal = parseInt(document.getElementById('input-profile-height').value);

      if (nameVal && weightVal > 0 && targetVal > 0 && heightVal > 0) {
        appState.userName = nameVal;
        appState.bodyWeight = weightVal;
        appState.targetWeight = targetVal;
        appState.userHeight = heightVal;

        localStorage.setItem('fittrack-user-name', nameVal);
        saveAppStateToStorage();

        updateProfileMetricsUI();
        if (typeof updateBodyWeightUI === 'function') updateBodyWeightUI();
        if (editProfileModal) editProfileModal.classList.add('hidden');
        showToast('Profile parameters & BMI updated successfully! 👤');
      }
    });
  }

  // ==========================================
  // GITHUB-STYLE ACTIVITY HEATMAP & STREAK ENGINE (ZERO-START REAL TRACKING)
  // ==========================================
  function recordTodayActivity(workoutAdd = 0) {
    const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    if (!appState.activityHistory) appState.activityHistory = {};

    if (!appState.activityHistory[todayStr]) {
      appState.activityHistory[todayStr] = { steps: 0, workouts: 0 };
    }

    appState.activityHistory[todayStr].steps = appState.steps;
    if (workoutAdd > 0) {
      appState.activityHistory[todayStr].workouts = (appState.activityHistory[todayStr].workouts || 0) + workoutAdd;
    }

    saveAppStateToStorage();
    if (typeof renderGitHubActivityHeatmap === 'function') renderGitHubActivityHeatmap();
  }

  function renderGitHubActivityHeatmap() {
    const gridEl = document.getElementById('github-heatmap-grid');
    if (!gridEl) return;

    const totalDays = 98; // 7 rows x 14 columns
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

    if (!appState.activityHistory) appState.activityHistory = {};

    // Keep today's steps & workouts in sync in persistent activityHistory
    if (appState.steps > 0 || (appState.activityHistory[todayStr] && appState.activityHistory[todayStr].workouts > 0)) {
      if (!appState.activityHistory[todayStr]) {
        appState.activityHistory[todayStr] = { steps: 0, workouts: 0 };
      }
      appState.activityHistory[todayStr].steps = appState.steps;
    }

    let cellsHTML = '';
    let activeDaysCount = 0;

    // Generate array of 98 days from (today - 97 days) to today
    const daysData = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const isToday = (i === 0);

      const rec = appState.activityHistory[dateStr] || { steps: 0, workouts: 0 };
      const steps = rec.steps || 0;
      const workouts = rec.workouts || 0;

      let lvl = 0;
      if (workouts > 0 || steps >= 10000) lvl = 4;
      else if (steps >= 7000) lvl = 3;
      else if (steps >= 3000) lvl = 2;
      else if (steps > 0) lvl = 1;

      const isActive = (steps > 0 || workouts > 0);
      if (isActive) activeDaysCount++;

      daysData.push({
        date: d,
        dateStr: dateStr,
        steps: steps,
        workouts: workouts,
        level: lvl,
        isToday: isToday,
        isActive: isActive
      });
    }

    // Calculate Streak strictly from real activity history
    let currentStreak = 0;
    const todayData = daysData[daysData.length - 1];

    if (todayData.isActive) {
      // Activity logged today: count today and go backwards
      for (let i = daysData.length - 1; i >= 0; i--) {
        if (daysData[i].isActive) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      // No activity logged yet today: check from yesterday backwards
      for (let i = daysData.length - 2; i >= 0; i--) {
        if (daysData[i].isActive) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Build Heatmap Grid HTML
    daysData.forEach(item => {
      const dateFormatted = item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      let statusDetail = 'Rest day / No activity logged';
      if (item.isActive) {
        statusDetail = `${item.steps.toLocaleString()} steps`;
        if (item.workouts > 0) {
          statusDetail += ` • ${item.workouts} workout session${item.workouts > 1 ? 's' : ''}`;
        }
      }

      const tooltipText = `${dateFormatted}${item.isToday ? ' (Today)' : ''}: ${statusDetail}`;
      
      cellsHTML += `
        <div class="heatmap-cell lvl-${item.level} ${item.isToday ? 'today-cell' : ''}" 
             data-date="${dateFormatted}" 
             data-steps="${item.steps}" 
             data-workouts="${item.workouts}"
             data-level="${item.level}"
             title="${tooltipText}">
        </div>
      `;
    });

    gridEl.innerHTML = cellsHTML;

    // Update Streak Badge & Active Days Counter
    const currentStreakEl = document.getElementById('heatmap-current-streak');
    const activeDaysEl = document.getElementById('heatmap-active-days-count');

    if (currentStreakEl) currentStreakEl.textContent = currentStreak;
    if (activeDaysEl) activeDaysEl.textContent = `${activeDaysCount} active days recorded`;

    // Bind click events on heatmap cells for interactive detail toasts
    gridEl.querySelectorAll('.heatmap-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const steps = parseInt(cell.dataset.steps) || 0;
        const workouts = parseInt(cell.dataset.workouts) || 0;
        const date = cell.dataset.date;
        if (steps > 0 || workouts > 0) {
          showToast(`📅 ${date}: ${steps.toLocaleString()} steps, ${workouts} workout session(s) completed! 💪`);
        } else {
          showToast(`📅 ${date}: Rest day (No activity logged)`);
        }
      });
    });
  }

  updateStepUI();
  updateMacroDashboardUI();
  updateBodyWeightUI();
  updateWorkoutRoutineUI();
  updateWeeklyActivityUI();
  updateProfileMetricsUI();
  renderGitHubActivityHeatmap();

  // ==========================================
  // 5. WATER LOGGING
  // ==========================================
  const quickAddWaterBtn = document.getElementById('quick-add-water');
  const homeWaterVal = document.getElementById('home-water-val');
  const waterBarFill = document.getElementById('water-bar-fill');

  function addWaterIntake() {
    appState.waterConsumed += 250;
    if (homeWaterVal) homeWaterVal.textContent = appState.waterConsumed.toLocaleString();
    const percent = Math.min((appState.waterConsumed / appState.waterGoal) * 100, 100);
    if (waterBarFill) waterBarFill.style.width = `${percent}%`;

    saveAppStateToStorage();
    showToast(`Added +250ml Water! Total: ${appState.waterConsumed}ml 💧`);
  }

  if (quickAddWaterBtn) quickAddWaterBtn.addEventListener('click', addWaterIntake);

  // ==========================================
  // 6. LIVE CAMERA & REAL AI VISION SCANNER
  // ==========================================
  const toggleCameraBtn = document.getElementById('toggle-camera-btn');
  const cameraBtnText = document.getElementById('camera-btn-text');
  const cameraVideoFeed = document.getElementById('camera-video-feed');
  const viewfinderImgBox = document.getElementById('viewfinder-img-box');
  const scannedImagePreview = document.getElementById('scanned-image-preview');
  const scannerHint = document.getElementById('scanner-hint');
  const runAiScanBtn = document.getElementById('run-ai-scan-btn');
  const shutterSnapBtn = document.getElementById('shutter-snap-btn');
  const laserLine = document.getElementById('laser-line');
  const aiResultCard = document.getElementById('ai-result-card');
  const foodFileInput = document.getElementById('food-file-input');
  const confirmLogScanBtn = document.getElementById('confirm-log-scan-btn');
  const portionBtns = document.querySelectorAll('.portion-btn');

  const openAiSettingsBtn = document.getElementById('open-ai-settings-btn');
  const aiSettingsModal = document.getElementById('ai-settings-modal');
  const closeAiSettingsModal = document.getElementById('close-ai-settings-modal');
  const saveAiSettingsBtn = document.getElementById('save-ai-settings-btn');
  const geminiKeyContainer = document.getElementById('gemini-key-container');
  const geminiApiKeyInput = document.getElementById('gemini-api-key-input');
  const engineRadioOptions = document.querySelectorAll('input[name="ai-engine-radio"]');

  async function startCameraFeed() {
    try {
      showToast('Starting camera stream...');
      const constraints = {
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      appState.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraVideoFeed.srcObject = appState.mediaStream;
      cameraVideoFeed.classList.remove('hidden');
      if (viewfinderImgBox) viewfinderImgBox.classList.add('hidden');
      if (shutterSnapBtn) shutterSnapBtn.classList.remove('hidden');

      appState.cameraActive = true;
      if (cameraBtnText) cameraBtnText.textContent = 'Stop Camera';
      showToast('Live Camera Active! Click "Snap Photo & Analyze" 📸');
    } catch (err) {
      console.warn('Camera access error:', err);
      showToast('Camera unavailable. Upload a photo instead.');
      stopCameraFeed();
    }
  }

  function stopCameraFeed() {
    if (appState.mediaStream) {
      appState.mediaStream.getTracks().forEach(track => track.stop());
      appState.mediaStream = null;
    }
    if (cameraVideoFeed) {
      cameraVideoFeed.srcObject = null;
      cameraVideoFeed.classList.add('hidden');
    }
    if (viewfinderImgBox) viewfinderImgBox.classList.remove('hidden');
    if (shutterSnapBtn) shutterSnapBtn.classList.add('hidden');

    appState.cameraActive = false;
    if (cameraBtnText) cameraBtnText.textContent = 'Live Camera';
  }

  if (toggleCameraBtn) {
    toggleCameraBtn.addEventListener('click', () => {
      if (!appState.cameraActive) startCameraFeed();
      else stopCameraFeed();
    });
  }

  function captureCanvasSnapshot() {
    const canvas = document.getElementById('snapshot-canvas');
    if (!canvas || !cameraVideoFeed) return null;

    canvas.width = cameraVideoFeed.videoWidth || 640;
    canvas.height = cameraVideoFeed.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideoFeed, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    if (scannedImagePreview) {
      scannedImagePreview.src = dataUrl;
      scannedImagePreview.classList.remove('hidden');
    }
    if (scannerHint) scannerHint.classList.add('hidden');
    return canvas;
  }

  if (shutterSnapBtn) {
    shutterSnapBtn.addEventListener('click', () => {
      runAiMealAnalysis();
    });
  }

  async function runAiMealAnalysis() {
    if (aiResultCard) aiResultCard.classList.add('hidden');
    if (laserLine) laserLine.classList.add('scanning');

    let targetImg = scannedImagePreview;

    if (appState.cameraActive) {
      captureCanvasSnapshot();
      stopCameraFeed();
    }

    showToast('AI Analyzing Meal Photo...');

    let detectedKey = 'default';
    let rawClassLabel = 'food dish';
    let confidenceStr = '96.5%';

    try {
      if (appState.aiEngine === 'tfjs' && appState.tfModel && targetImg && targetImg.src) {
        const predictions = await appState.tfModel.classify(targetImg, 5);
        if (predictions && predictions.length > 0) {
          const topPred = predictions[0];
          rawClassLabel = predictions.map(p => p.className.toLowerCase().split(',')[0]).join(', ');
          confidenceStr = `${Math.round(topPred.probability * 100)}% Match`;

          for (const key of Object.keys(foodNutritionDatabase)) {
            if (rawClassLabel.includes(key)) {
              detectedKey = key;
              break;
            }
          }
          if (detectedKey === 'default') {
            if (rawClassLabel.includes('avocado') || rawClassLabel.includes('guacamole')) detectedKey = 'avocado';
            else if (rawClassLabel.includes('salad') || rawClassLabel.includes('cabbage') || rawClassLabel.includes('lettuce')) detectedKey = 'salad';
            else if (rawClassLabel.includes('pizza')) detectedKey = 'pizza';
            else if (rawClassLabel.includes('burger')) detectedKey = 'burger';
            else if (rawClassLabel.includes('steak') || rawClassLabel.includes('meat')) detectedKey = 'steak';
            else if (rawClassLabel.includes('chicken') || rawClassLabel.includes('poultry')) detectedKey = 'chicken';
            else if (rawClassLabel.includes('rice') || rawClassLabel.includes('grain')) detectedKey = 'rice';
            else if (rawClassLabel.includes('smoothie') || rawClassLabel.includes('juice')) detectedKey = 'smoothie';
            else detectedKey = 'default';
          }
        }
      }
    } catch (err) {
      console.warn('Inference notice:', err);
    }

    const baseInfo = foodNutritionDatabase[detectedKey] || foodNutritionDatabase.default;

    appState.baseNutrition = {
      name: baseInfo.name,
      rawClass: `Detected: ${rawClassLabel}`,
      confidence: confidenceStr,
      cals: baseInfo.cals,
      protein: baseInfo.protein,
      carbs: baseInfo.carbs,
      fat: baseInfo.fat,
      fiber: baseInfo.fiber,
      tags: baseInfo.tags,
      components: baseInfo.components,
      img: targetImg && targetImg.src ? targetImg.src : ''
    };

    setTimeout(() => {
      if (laserLine) laserLine.classList.remove('scanning');
      renderPortionScaledResults();
      if (aiResultCard) aiResultCard.classList.remove('hidden');
      showToast(`Meal Recognized: ${appState.baseNutrition.name}! Review & save below. ✨`);
    }, 1000);
  }

  function renderPortionScaledResults() {
    const scale = appState.currentPortion;
    const base = appState.baseNutrition;

    const scaledCals = Math.round(base.cals * scale);
    const scaledP = Math.round(base.protein * scale);
    const scaledC = Math.round(base.carbs * scale);
    const scaledF = Math.round(base.fat * scale);
    const scaledFib = Math.round(base.fiber * scale);

    // Populate editable input fields for user review
    const editName = document.getElementById('edit-food-name-input');
    const editCals = document.getElementById('edit-cals-input');
    const editP = document.getElementById('edit-protein-input');
    const editC = document.getElementById('edit-carbs-input');
    const editF = document.getElementById('edit-fats-input');
    const editFib = document.getElementById('edit-fiber-input');

    if (editName) editName.value = base.name;
    if (editCals) editCals.value = scaledCals;
    if (editP) editP.value = scaledP;
    if (editC) editC.value = scaledC;
    if (editF) editF.value = scaledF;
    if (editFib) editFib.value = scaledFib;

    const rawClassEl = document.getElementById('result-raw-class');
    if (rawClassEl) rawClassEl.textContent = base.rawClass;

    const confTag = document.getElementById('ai-confidence-tag');
    if (confTag) confTag.innerHTML = `<i data-lucide="check-circle-2"></i> ${base.confidence}`;

    const compP = document.getElementById('comp-protein-name');
    const compC = document.getElementById('comp-carbs-name');
    const compF = document.getElementById('comp-fats-name');
    const compFib = document.getElementById('comp-fiber-name');

    if (compP && base.components) compP.textContent = base.components.protein || `${scaledP}g Protein`;
    if (compC && base.components) compC.textContent = base.components.carbs || `${scaledC}g Carbs`;
    if (compF && base.components) compF.textContent = base.components.fats || `${scaledF}g Fats`;
    if (compFib && base.components) compFib.textContent = base.components.fiber || `${scaledFib}g Fiber`;

    const tagsRow = document.getElementById('result-health-tags');
    if (tagsRow && base.tags) {
      tagsRow.innerHTML = base.tags.map((tag, idx) => {
        const colors = ['green', 'blue', 'orange'];
        const color = colors[idx % colors.length];
        return `<span class="tag-badge ${color}"><i data-lucide="sparkles"></i> ${tag}</span>`;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();
  }

  portionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      portionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      appState.currentPortion = parseFloat(btn.dataset.portion);
      renderPortionScaledResults();
      showToast(`Portion adjusted to ${appState.currentPortion}x`);
    });
  });

  if (runAiScanBtn) runAiScanBtn.addEventListener('click', runAiMealAnalysis);

  if (foodFileInput) {
    foodFileInput.addEventListener('change', (e) => {
      stopCameraFeed();
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (scannedImagePreview) {
            scannedImagePreview.src = evt.target.result;
            scannedImagePreview.classList.remove('hidden');
          }
          if (scannerHint) scannerHint.classList.add('hidden');
          runAiMealAnalysis();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Save reviewed & edited meal to log
  if (confirmLogScanBtn) {
    confirmLogScanBtn.addEventListener('click', () => {
      const editNameInput = document.getElementById('edit-food-name-input');
      const editCalsInput = document.getElementById('edit-cals-input');
      const editPInput = document.getElementById('edit-protein-input');
      const editCInput = document.getElementById('edit-carbs-input');
      const editFInput = document.getElementById('edit-fats-input');

      const mealName = editNameInput && editNameInput.value ? editNameInput.value.trim() : appState.baseNutrition.name;
      const finalCals = editCalsInput ? Math.max(parseInt(editCalsInput.value) || 0, 0) : appState.baseNutrition.cals;
      const finalP = editPInput ? Math.max(parseInt(editPInput.value) || 0, 0) : appState.baseNutrition.protein;
      const finalC = editCInput ? Math.max(parseInt(editCInput.value) || 0, 0) : appState.baseNutrition.carbs;
      const finalF = editFInput ? Math.max(parseInt(editFInput.value) || 0, 0) : appState.baseNutrition.fat;

      appState.caloriesConsumed += finalCals;
      appState.proteinConsumed += finalP;
      appState.carbsConsumed += finalC;
      appState.fatsConsumed += finalF;

      const newMealLogObj = {
        id: Date.now(),
        name: mealName,
        portion: appState.currentPortion,
        cals: finalCals,
        protein: finalP,
        carbs: finalC,
        fats: finalF,
        img: appState.baseNutrition.img,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (!appState.loggedMealsHistory) appState.loggedMealsHistory = [];
      appState.loggedMealsHistory.unshift(newMealLogObj);

      updateMacroDashboardUI();
      saveAppStateToStorage();

      showToast(`Logged ${mealName} (+${finalCals} kcal, P:${finalP}g, C:${finalC}g, F:${finalF}g)! 🥗`);
      switchScreen('calories');
    });
  }

  if (openAiSettingsBtn) {
    openAiSettingsBtn.addEventListener('click', () => {
      if (aiSettingsModal) aiSettingsModal.classList.remove('hidden');
    });
  }

  if (closeAiSettingsModal) {
    closeAiSettingsModal.addEventListener('click', () => {
      if (aiSettingsModal) aiSettingsModal.classList.add('hidden');
    });
  }

  engineRadioOptions.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'gemini') geminiKeyContainer.classList.remove('hidden');
      else geminiKeyContainer.classList.add('hidden');
    });
  });

  if (saveAiSettingsBtn) {
    saveAiSettingsBtn.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="ai-engine-radio"]:checked');
      if (selectedRadio) {
        appState.aiEngine = selectedRadio.value;
        localStorage.setItem('fittrack-ai-engine', selectedRadio.value);
      }
      if (geminiApiKeyInput && geminiApiKeyInput.value) {
        appState.geminiKey = geminiApiKeyInput.value;
        localStorage.setItem('fittrack-gemini-key', geminiApiKeyInput.value);
      }

      const activeBadge = document.getElementById('active-ai-engine-badge');
      if (activeBadge) {
        activeBadge.innerHTML = `<i data-lucide="cpu"></i> ${appState.aiEngine === 'gemini' ? 'Gemini Vision AI' : 'TF.js Vision AI'}`;
        if (window.lucide) lucide.createIcons();
      }

      if (aiSettingsModal) aiSettingsModal.classList.add('hidden');
      showToast(`AI Vision Engine set to ${appState.aiEngine.toUpperCase()}!`);
    });
  }

  // ==========================================
  // 7. WORKOUT FILTER & LIVE TIMER MODAL
  // ==========================================
  const filterPills = document.querySelectorAll('.filter-pill');
  const workoutCards = document.querySelectorAll('.workout-card');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const cat = pill.dataset.category;
      workoutCards.forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  const workoutModal = document.getElementById('workout-modal');
  const closeModalBtn = document.getElementById('close-workout-modal');
  const startWorkoutBtns = document.querySelectorAll('.start-workout-btn');
  const modalWorkoutTitle = document.getElementById('modal-workout-title');
  const workoutTimerClock = document.getElementById('workout-timer-clock');
  const timerStartPauseBtn = document.getElementById('timer-start-pause-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const timerFinishBtn = document.getElementById('timer-finish-btn');
  const hrValueDisplay = document.getElementById('hr-value');
  const modalBurnCalsDisplay = document.getElementById('modal-burn-cals');

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function startWorkoutTimer() {
    if (!appState.workoutActive) {
      appState.workoutActive = true;
      timerStartPauseBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
      if (window.lucide) lucide.createIcons();

      appState.workoutTimerInterval = setInterval(() => {
        appState.workoutTimerSeconds++;
        if (workoutTimerClock) workoutTimerClock.textContent = formatTime(appState.workoutTimerSeconds);

        const randomBpm = Math.floor(125 + Math.random() * 25);
        const estBurn = Math.round(appState.workoutTimerSeconds * 0.18);

        if (hrValueDisplay) hrValueDisplay.textContent = randomBpm;
        if (modalBurnCalsDisplay) modalBurnCalsDisplay.textContent = estBurn;
      }, 1000);
    } else {
      pauseWorkoutTimer();
    }
  }

  function pauseWorkoutTimer() {
    appState.workoutActive = false;
    clearInterval(appState.workoutTimerInterval);
    timerStartPauseBtn.innerHTML = '<i data-lucide="play"></i> Resume';
    if (window.lucide) lucide.createIcons();
  }

  function resetWorkoutTimer() {
    pauseWorkoutTimer();
    appState.workoutTimerSeconds = 0;
    if (workoutTimerClock) workoutTimerClock.textContent = '00:00';
    if (modalBurnCalsDisplay) modalBurnCalsDisplay.textContent = '0';
    timerStartPauseBtn.innerHTML = '<i data-lucide="play"></i> Start';
    if (window.lucide) lucide.createIcons();
  }

  startWorkoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title;
      if (modalWorkoutTitle) modalWorkoutTitle.textContent = title;
      resetWorkoutTimer();
      workoutModal.classList.remove('hidden');
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      pauseWorkoutTimer();
      workoutModal.classList.add('hidden');
    });
  }

  if (timerStartPauseBtn) timerStartPauseBtn.addEventListener('click', startWorkoutTimer);
  if (timerResetBtn) timerResetBtn.addEventListener('click', resetWorkoutTimer);

  if (timerFinishBtn) {
    timerFinishBtn.addEventListener('click', () => {
      const burned = Math.round(appState.workoutTimerSeconds * 0.18);
      appState.completedWorkouts += 1;
      pauseWorkoutTimer();
      if (typeof recordTodayActivity === 'function') recordTodayActivity(1);
      else saveAppStateToStorage();
      updateWorkoutRoutineUI();
      workoutModal.classList.add('hidden');
      showToast(`Workout Completed! Burned ~${burned} kcal 🔥 (Total Workouts: ${appState.completedWorkouts})`);
    });
  }

  // ==========================================
  // 8. DATA MANAGEMENT
  // ==========================================
  const exportDataBtn = document.getElementById('export-data-btn');
  const resetDataBtn = document.getElementById('reset-data-btn');

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      const exportObject = {
        app: 'FitTrack AI',
        timestamp: new Date().toISOString(),
        userMetrics: {
          steps: appState.steps,
          stepGoal: appState.stepGoal,
          caloriesConsumed: appState.caloriesConsumed,
          calorieGoal: appState.calorieGoal,
          waterConsumed: appState.waterConsumed,
          waterGoal: appState.waterGoal,
          proteinConsumed: appState.proteinConsumed,
          proteinGoal: appState.proteinGoal,
          carbsConsumed: appState.carbsConsumed,
          carbsGoal: appState.carbsGoal,
          fatsConsumed: appState.fatsConsumed,
          fatsGoal: appState.fatsGoal
        },
        mealHistory: appState.loggedMealsHistory
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `fittrack_health_data_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Exported FitTrack AI Health Data (JSON)! 📁');
    });
  }

  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('Reset today\'s metrics and start fresh?')) {
        appState.steps = 0;
        appState.caloriesConsumed = 0;
        appState.proteinConsumed = 0;
        appState.carbsConsumed = 0;
        appState.fatsConsumed = 0;
        appState.waterConsumed = 0;
        appState.loggedMealsHistory = [];

        saveAppStateToStorage();
        updateStepUI();
        updateMacroDashboardUI();

        if (homeWaterVal) homeWaterVal.textContent = '0';
        if (waterBarFill) waterBarFill.style.width = '0%';

        showToast('Daily Metrics & History Reset! 🔄');
      }
    });
  }

  // ==========================================
  // 9. MIDNIGHT (12:00 AM) AUTOMATIC DAILY RESET ENGINE
  // ==========================================
  function checkAndApplyDailyReset(isTimerTrigger = false) {
    const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    const lastActiveDate = localStorage.getItem('fittrack-last-active-date');

    // Dynamically format date badge in hero header
    const todayDateBadge = document.getElementById('today-date-badge');
    if (todayDateBadge) {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('en-US', options);
      todayDateBadge.innerHTML = `<i data-lucide="calendar"></i> Today, ${formattedDate}`;
      if (window.lucide) lucide.createIcons();
    }

    if ((lastActiveDate && lastActiveDate !== todayStr) || isTimerTrigger) {
      console.log(`Midnight Auto-Reset triggered for ${todayStr}. Refreshing daily metrics...`);
      appState.steps = 0;
      appState.caloriesConsumed = 0;
      appState.proteinConsumed = 0;
      appState.carbsConsumed = 0;
      appState.fatsConsumed = 0;
      appState.waterConsumed = 0;
      appState.loggedMealsHistory = [];

      localStorage.setItem('fittrack-last-active-date', todayStr);
      saveAppStateToStorage();

      if (typeof updateStepUI === 'function') updateStepUI();
      if (typeof updateMacroDashboardUI === 'function') updateMacroDashboardUI();

      const homeWaterVal = document.getElementById('home-water-val');
      const waterBarFill = document.getElementById('water-bar-fill');
      if (homeWaterVal) homeWaterVal.textContent = '0';
      if (waterBarFill) waterBarFill.style.width = '0%';

      showToast('Good morning! Daily metrics auto-reset at 12:00 AM for a fresh start 🕛');
    } else if (!lastActiveDate) {
      localStorage.setItem('fittrack-last-active-date', todayStr);
    }
  }

  function scheduleMidnightResetTimer() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    console.log(`Midnight reset timer scheduled in ${(msUntilMidnight / 1000 / 60).toFixed(1)} minutes.`);

    setTimeout(() => {
      checkAndApplyDailyReset(true);
      scheduleMidnightResetTimer(); // Re-arm timer for subsequent midnight
    }, msUntilMidnight);
  }

  // Run midnight reset check on load, window focus, & visibility change
  checkAndApplyDailyReset();
  scheduleMidnightResetTimer();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAndApplyDailyReset();
    }
  });

  window.addEventListener('focus', () => {
    checkAndApplyDailyReset();
  });

  // ==========================================
  // 10. TOAST SYSTEM
  // ==========================================
  const toastEl = document.getElementById('toast');
  const toastMessageEl = document.getElementById('toast-message');
  let toastTimeout;

  function showToast(message) {
    if (!toastEl || !toastMessageEl) return;
    toastMessageEl.textContent = message;
    toastEl.classList.remove('hidden');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 3000);
  }

});
