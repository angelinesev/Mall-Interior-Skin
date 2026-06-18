(function () {
  // Prevent duplicate asset injection
  if (window.showNavigation1 || window.showNavigation2) return;
  if (document.getElementById('immersive-canvas-nav1')) return;

  /* ==========================================================================
     ─── CORE DATA STRUCTURES ───
     ========================================================================== */

  var FLOORS = [
    { id: 'floor-l3', title: '3RD FLOOR LUXURY ATRIUM',    shortTitle: 'L3', panoramaName: 'third_floor' },
    { id: 'floor-l2', title: '2ND FLOOR UPPER PROMENADE',  shortTitle: 'L2', panoramaName: 'second_floor' },
    { id: 'floor-g',  title: 'GROUND LUXURY ATRIUM',       shortTitle: 'G',  panoramaName: 'ground_floor' }
  ];

  var FALLBACK_ROOM = {
    id: 'unknown',
    title: 'REIMAGINE THIS SPACE',
    description: 'Explore this unit to see layout details appear here automatically.',
    panoramaName: '',
    metrics: []
  };

  const BLUEPRINT_OPTIONS = [
    { 
      id: 'corp-hq',        
      label: 'Corporate HQ Layout',    
      cost: 145, 
      panoramaName: 'AME_INT-DRESSED_UNIT_02-D01_PARKLINKS MALL_AYA',
      description: 'A modern corporate environment engineered for peak corporate collaboration, featuring private executive offices, open-plan workstations, and boardrooms equipped with modern conferencing infrastructure.',
      metrics: [
        { label: 'WORKSTATIONS', value: '45 Desks', icon: 'monitor' },
        { label: 'MEETING ROOMS', value: '3 Rooms', icon: 'briefcase' }
      ]
    },
    { 
      id: 'coworking',      
      label: 'Co-working Layout',      
      cost: 115, 
      panoramaName: 'AME_INT-DRESSED_UNIT01-D1_PARKLINKS MALL_AYA',
      description: 'A highly flexible, high-density shared space tailored for hot-desking, collaborative breakout hubs, and integrated phone booths optimized for freelance and startup productivity.',
      metrics: [
        { label: 'HOT DESKS', value: '60 Seats', icon: 'users' },
        { label: 'PHONE BOOTHS', value: '4 Units', icon: 'phone' }
      ]
    },
    { 
      id: 'medical',        
      label: 'Medical Clinic Layout',  
      cost: 115, 
      panoramaName: 'AME_INT-DRESSED_UNIT_02-D01_PARKLINKS MALL_AYA',
      description: 'Healthcare-ready specialized fitout engineered with sanitary wash stations, private consultation suites, and a spacious reception lounge optimized for clinical flow.',
      metrics: [
        { label: 'EXAM ROOMS', value: '6 Suites', icon: 'stethoscopes' },
        { label: 'WAITING CAPACITY', value: '18 Patients', icon: 'heart' }
      ]
    },
    { 
      id: 'bpo',            
      label: 'BPO Operational Setup',  
      cost: 115, 
      panoramaName: 'AME_INT-DRESSED_UNIT01-D1_PARKLINKS MALL_AYA',
      description: 'An optimized high-occupancy layout explicitly built for 24/7 operations, structured with acoustic dampening, robust localized data centers, and back-to-back call agent modules.',
      metrics: [
        { label: 'OPERATIONAL SEATS', value: '120 Stations', icon: 'headphones' },
        { label: 'SERVER RACKS', value: '4 Enclosures', icon: 'server' }
      ]
    }, 
    { 
      id: 'cafe',           
      label: 'Cafe / F&B Ready',       
      cost: 165, 
      panoramaName: 'AME_INT-DRESSED_UNIT_02-D01_PARKLINKS MALL_AYA',
      description: 'A beautiful hospitality setup complete with designated kitchen plumbing provisions, heavy-duty electrical loads for espresso machinery, and curated dining floor dynamics.',
      metrics: [
        { label: 'DINING TABLES', value: '18 Four-Seaters', icon: 'utensils' },
        { label: 'BAR FRONTAGE', value: '35 Linear Ft', icon: 'columns' },
        { label: 'TOTAL SEATING', value: '54 Patrons', icon: 'smile' }
      ]
    },   
    { 
      id: 'fashion-retail', label: 'Fashion Retail Layout',  cost: 130, panoramaName: 'AME_INT-DRESSED_UNIT01-D1_PARKLINKS MALL_AYA',
      description: 'A premium apparel retail layout with warm ambient lighting, highly visible product display modules, and curated fitting zones designed to elevate the browsing lifecycle.',
      metrics: [
        { label: 'DISPLAY LINES', value: '60 Linear Ft', icon: 'grid' },
        { label: 'FITTING ROOMS', value: '2 Rooms', icon: 'door-open' }
      ]
    },
    { 
      id: 'electronics',    label: 'Electronics Showroom',   cost: 130, panoramaName: 'AME_INT-DRESSED_UNIT_02-D01_PARKLINKS MALL_AYA',
      description: 'A sleek interactive retail floor equipped with active under-floor security wiring, high-illumination product island tables, and dedicated tech support counters.',
      metrics: [
        { label: 'LIVE DEMO ZONES', value: '4 Islands', icon: 'smartphone' },
        { label: 'SUPPORT DESKS', value: '2 Counters', icon: 'wrench' }
      ]
    },
    { 
      id: 'kiosk',          label: 'Compact QSR Kiosk',      cost: 130, panoramaName: 'AME_INT-DRESSED_UNIT_02-D01_PARKLINKS MALL_AYA',
      description: 'An ultra-efficient micro-layout built for quick-service restaurants, optimized with exhaust ventilation routes, integrated POS staging fields, and cold storage footprints.',
      metrics: [
        { label: 'POS TERMINALS', value: '2 Stations', icon: 'credit-card' },
        { label: 'PREP COUNTERS', value: '22 Linear Ft', icon: 'layers' }
      ]
    },
  ];

  const CALC_SCENARIO_COSTS = {};
  BLUEPRINT_OPTIONS.forEach(opt => { CALC_SCENARIO_COSTS[opt.id] = opt.cost; });

  /* ==========================================================================
     ─── GLOBAL SYSTEM STATE ───
     ========================================================================== */
  const state = {
    activeFloorId: 'floor-g',
    activeBlueprintId: 'corp-hq', 
    nav1Visible: false,
    nav2Visible: false,
    calc: {
      visible: false,
      currentScenarioId: "corp-hq",
      usableAreaSqFt: 15000,
      baseRentalRate: 45,          // ₱/sq ft/month
      camRate: 8,                  // Common Area Maintenance
      fitoutCostPerSqFt: 145,
      leaseTermMonths: 60,
      securityDepositMonths: 3,
      advanceRentMonths: 2,
      includeFitoutAllocation: true
    }
  };

  let mediaRequestId = 0;
  let firstJump = true;

  /* ==========================================================================
     ─── CORE UTILITIES & PLAYER BRIDGE ───
     ========================================================================== */
  function sel(id) { return document.getElementById(id); }
  function setText(id, text) { var el = sel(id); if (el) el.textContent = text; }

  function getFloor() {
    return FLOORS.find(function (f) { return f.id === state.activeFloorId; }) || FLOORS[2];
  }

  function getActiveBlueprint() {
    return BLUEPRINT_OPTIONS.find(function (b) { return b.id === state.calc.currentScenarioId; }) || BLUEPRINT_OPTIONS[0];
  }

  function getPlayer() {
    var tourRoot = (window.tour && (window.tour.getRoot ? window.tour.getRoot() : window.tour.root)) || window.tour || null;
    return window.player || window.vtour || (tourRoot && tourRoot.locManager && tourRoot.locManager.rootPlayer) || (tourRoot && tourRoot.player) || null;
  }

  function refreshPlayer(player) {
    try { player.drawScene && player.drawScene(); } catch (e) {}
    try { player.render    && player.render();    } catch (e) {}
    try { player.update    && player.update();    } catch (e) {}
  }

  function tryJump(mediaName) {
    var player = getPlayer();
    if (!player) return false;
    var attempts = [
      function () { player.setMediaByName(mediaName); },
      function () { window.tour.setMediaByName(mediaName); },
      function () { player.openPanorama(mediaName); }
    ];
    for (var i = 0; i < attempts.length; i++) {
      try { attempts[i](); refreshPlayer(player); return true; } catch (e) {}
    }
    return false;
  }

  function goToPanorama(mediaName, immediate) {
    if (!mediaName) return;
    mediaRequestId++;
    var requestId = mediaRequestId;
    var delay = immediate ? 0 : (firstJump ? 800 : 0);
    firstJump = false;

    setTimeout(function () {
      if (requestId !== mediaRequestId) return;
      if (!tryJump(mediaName)) {
        var timer = setInterval(function () {
          if (requestId !== mediaRequestId) { clearInterval(timer); return; }
          if (tryJump(mediaName)) clearInterval(timer);
        }, 80);
        setTimeout(function () { clearInterval(timer); }, 4000);
      }
    }, delay);
  }

  function normalizeMediaKey(raw) {
    return String(raw || '')
      .toLowerCase()
      .trim()
      .replace(/\.(jpg|jpeg|png|pan|xml|tiles?|webp)$/i, '')
      .replace(/[\s_-]+/g, ' ')
      .trim();
  }

  /* ─── 3DVISTA EXPANSION: FULL-SCREEN OVERLAY ENGINE ─── */
  function openExternalFloorplanIframe() {
    var existingView = sel('custom-fullscreen-floorplan-container');
    if (existingView) {
      existingView.style.setProperty('display', 'block', 'important');
      return;
    }

    var fullScreenContainer = document.createElement('div');
    fullScreenContainer.id = 'custom-fullscreen-floorplan-container';
    
    fullScreenContainer.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:2147483647; background:#000000; display:block; border:none; margin:0; padding:0; overflow:hidden;';
    
    fullScreenContainer.innerHTML = `
      <iframe allowfullscreen="true" allow="accelerometer; autoplay; camera; display-capture; fullscreen; geolocation; gyroscope; magnetometer; microphone; vr; xr-spatial-tracking" src="https://floorplan-client.netlify.app/" frameborder="0" scrolling="auto" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; margin:0; padding:0; z-index:1;"></iframe>
      
      <div style="position:absolute; bottom:40px; right:40px; z-index:2147483645; pointer-events:auto;">
        <button id="close-fullscreen-floorplan-btn" style="height:48px; padding:0 24px; border-radius:50px; background:#ffffff; border:1px solid rgba(0,0,0,0.05); cursor:pointer; box-shadow:0 20px 40px rgba(0,0,0,0.4); display:flex; align-items:center; gap:10px; font-family:'Inter',sans-serif; font-size:12.5px; color:#0c0a09; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
          <i data-lucide="arrow-left" style="width:14px; height:14px; stroke-width:2.5px;"></i>
          <span>Return to Overview</span>
        </button>
      </div>
    `;

    document.body.appendChild(fullScreenContainer);
    refreshIcons();

    var btn = sel('close-fullscreen-floorplan-btn');
    if(btn) {
      btn.onmouseenter = function() {
        this.style.transform = 'scale(1.04) translateY(-2px)';
        this.style.boxShadow = '0 25px 50px rgba(0,0,0,0.55)';
      };
      btn.onmouseleave = function() {
        this.style.transform = 'scale(1) translateY(0)';
        this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
      };
      btn.onclick = function() {
        fullScreenContainer.style.setProperty('display', 'none', 'important');
      };
    }
  }

  /* ==========================================================================
     ─── STYLE INJECTION ───
     ========================================================================== */
  var styleTag = document.createElement('style');
  styleTag.innerHTML = `
    #immersive-canvas-nav1,
    #immersive-canvas-nav1 * { font-family: 'Inter', sans-serif !important; box-sizing: border-box; outline: none !important; }
    #immersive-canvas-nav1 {
      position: fixed !important; top: 40px !important; left: 40px !important; z-index: 99999998 !important;
      pointer-events: none !important; display: none; opacity: 0;
      transform: scale(0.95) translateY(-6px);
      transition: opacity 0.4s cubic-bezier(0.215, 0.61, 0.355, 1), transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    #immersive-canvas-nav1.hud-ready { opacity: 1 !important; transform: scale(1) translateY(0) !important; display: block !important; }

    .premium-directory-panel {
      width: 380px !important;
      background: rgba(10, 8, 6, 0.78) !important;
      backdrop-filter: blur(25px) saturate(130%) !important;
      -webkit-backdrop-filter: blur(25px) saturate(130%) !important;
      border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 28px !important;
      box-shadow: 0 40px 80px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.05) !important;
      padding: 24px 28px !important;
      display: flex !important; flex-direction: column !important; gap: 20px !important;
      pointer-events: auto !important;
    }
    .header-row-nav1    { display: flex !important; align-items: flex-start !important; gap: 16px !important; }
    .icon-badge-box     { width: 36px !important; height: 36px !important; border-radius: 50% !important; background: rgba(255,255,255,0.04) !important; border: 1px solid rgba(255,255,255,0.1) !important; display: flex !important; align-items: center !important; justify-content: center !important; color: rgba(255,255,255,0.8) !important; margin-top: 2px; }
    .meta-text-block    { display: flex !important; flex-direction: column !important; flex-grow: 1 !important; }
    .meta-subtitle      { font-family: 'Inter', sans-serif !important; font-size: 9px !important; font-weight: 500 !important; color: rgba(255,255,255,0.4) !important; letter-spacing: 2px !important; text-transform: uppercase !important; }
    .meta-title         { font-family: 'Marcellus', 'Trajan Pro', serif !important; font-size: 21px !important; font-weight: 400 !important; color: #ffffff !important; margin-top: 6px !important; letter-spacing: 2.5px !important; line-height: 1.3 !important; }

    .carousel-container { display: flex !important; align-items: center !important; gap: 8px !important; margin-top: 4px; }
    .carousel-track     { display: flex !important; gap: 8px !important; flex-grow: 1 !important; align-items: center !important; }
    
    .nav-arrow-btn      { width: 34px !important; height: 34px !important; border-radius: 50% !important; background: rgba(255,255,255,0.03) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.5) !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    .nav-arrow-btn:hover { background: rgba(255,255,255,0.1) !important; color: #ffffff !important; }
    
    .floor-caro-item    { position: relative !important; flex: 1 !important; height: 34px !important; border-radius: 50px !important; background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.5) !important; font-family: 'Inter', sans-serif !important; font-size: 10px !important; font-weight: 400 !important; letter-spacing: 1px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    .floor-caro-item:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.8) !important; }
    .floor-caro-item.is-active-level { background: #ffffff !important; border-color: #ffffff !important; color: #0c0a09 !important; font-weight: 600 !important; box-shadow: 0 10px 20px rgba(0,0,0,0.15) !important; }

    #immersive-canvas-nav2,
    #immersive-canvas-nav2 * { font-family: 'Inter', sans-serif !important; box-sizing: border-box; outline: none !important; }
    #immersive-canvas-nav2 {
      position: fixed !important; top: 40px !important; left: 40px !important; z-index: 99999997 !important;
      pointer-events: none !important; display: none; opacity: 0;
      transform: scale(0.95) translateY(-6px);
      transition: opacity 0.4s cubic-bezier(0.215, 0.61, 0.355, 1), transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    #immersive-canvas-nav2.hud-ready { opacity: 1; transform: scale(1) translateY(0) !important; display: block !important; }

    .nav2-main-panel {
      width: 380px !important;
      background: rgba(10, 8, 6, 0.78) !important;
      backdrop-filter: blur(25px) saturate(130%) !important;
      -webkit-backdrop-filter: blur(25px) saturate(130%) !important;
      border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 28px !important;
      box-shadow: 0 40px 80px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.05) !important;
      padding: 24px 28px !important;
      display: flex !important; flex-direction: column !important; gap: 20px !important;
      pointer-events: auto !important;
    }

    .nav2-header-row { display: flex !important; align-items: center !important; gap: 14px !important; }
    .nav2-title      { font-family: 'Marcellus', 'Trajan Pro', serif !important; font-size: 21px !important; font-weight: 400 !important; color: #ffffff !important; letter-spacing: 2.5px !important; }
    .nav2-desc       { font-family: 'Inter', sans-serif !important; font-size: 13px !important; font-weight: 300 !important; color: rgba(255,255,255,0.65) !important; line-height: 1.7 !important; text-align: justify; margin: 0 !important; }

    .nav2-metrics-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .nav2-metric-tile  { background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 16px !important; padding: 14px !important; display: flex !important; flex-direction: column !important; gap: 4px !important; }
    .nav2-metric-label { font-family: 'Inter', sans-serif !important; font-size: 9px !important; font-weight: 400 !important; color: rgba(255,255,255,0.4) !important; letter-spacing: 2px !important; text-transform: uppercase !important; display: flex !important; align-items: center !important; gap: 6px !important; }
    .nav2-metric-value { font-family: 'Inter', sans-serif !important; font-size: 13.5px !important; font-weight: 400 !important; color: #ffffff !important; }

    .nav2-blueprint-section { display: flex !important; flex-direction: column !important; gap: 10px !important; border-top: 1px solid rgba(255, 255, 255, 0.08) !important; padding-top: 16px !important; }
    .nav2-section-label { font-family: 'Inter', sans-serif !important; font-size: 9px !important; color: rgba(255,255,255,0.4) !important; font-weight: 400 !important; text-transform: uppercase !important; letter-spacing: 2px !important; }
    .nav2-blueprint-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; max-height: 130px !important; overflow-y: auto !important; padding-right: 4px !important; }
    .nav2-blueprint-grid::-webkit-scrollbar { width: 4px !important; }
    .nav2-blueprint-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1) !important; border-radius: 99px !important; }
    
    .nav2-blueprint-btn {
      padding: 10px 14px !important; border-radius: 50px !important;
      background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.08) !important;
      color: rgba(255,255,255,0.5) !important; font-family: 'Inter', sans-serif !important; font-size: 10.5px !important; font-weight: 400 !important;
      text-align: left !important; cursor: pointer !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .nav2-blueprint-btn:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.8) !important; }
    .nav2-blueprint-btn.is-active { background: #ffffff !important; border-color: #ffffff !important; color: #0c0a09 !important; font-weight: 500 !important; }

    .hud-action-footer-row { display: flex !important; gap: 10px !important; border-top: 1px solid rgba(255,255,255,0.08) !important; padding-top: 16px !important; margin-top: 4px !important; }
    .hud-footer-action-btn { flex: 1 !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; padding: 11px 16px !important; border-radius: 50px !important; background: rgba(255,255,255,0.03) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.7) !important; font-family: 'Inter', sans-serif !important; font-size: 11px !important; font-weight: 400 !important; letter-spacing: 1px; text-transform: uppercase; cursor: pointer !important; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    .hud-footer-action-btn:hover { background: #ffffff !important; border-color: #ffffff !important; color: #0c0a09 !important; font-weight: 500 !important; }

    #hud-cost-calculator-root,
    #hud-cost-calculator-root * { font-family: 'Inter', sans-serif !important; box-sizing: border-box; outline: none !important; }
    #hud-cost-calculator-root {
      position: fixed !important; bottom: 40px !important; right: 40px !important; z-index: 2147483640 !important;
      width: 420px !important; max-width: calc(100vw - 80px) !important; 
      background: rgba(10, 8, 6, 0.78) !important; backdrop-filter: blur(25px) saturate(130%) !important;
      -webkit-backdrop-filter: blur(25px) saturate(130%) !important; 
      border: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 28px !important;
      box-shadow: 0 40px 80px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.05) !important; 
      padding: 26px 28px !important;
      display: none !important; opacity: 0 !important; 
      transform: scale(0.95) translateY(6px) !important; 
      transition: opacity 0.4s cubic-bezier(0.215, 0.61, 0.355, 1), transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1) !important;
      pointer-events: auto !important;
    }
    #hud-cost-calculator-root.is-visible { 
      display: block !important; opacity: 1 !important; 
      transform: scale(1) translateY(0) !important; 
    }
    
    .calc-absolute-close-btn {
      position: absolute !important; top: 22px !important; right: 24px !important;
      width: 30px !important; height: 30px !important; border-radius: 50% !important;
      background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.08) !important;
      color: rgba(255, 255, 255, 0.4) !important; display: flex !important; align-items: center !important;
      justify-content: center !important; cursor: pointer !important; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .calc-absolute-close-btn:hover {
      background: #ffffff !important; border-color: #ffffff !important; color: #0c0a09 !important;
    }
    
    .calc-slider-pack { display: flex !important; flex-direction: column !important; gap: 6px !important; margin-bottom: 14px !important; }
    .calc-slider-meta { display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 10.5px !important; }
    .calc-slider-lbl { color: rgba(255,255,255,0.4) !important; font-weight: 400 !important; text-transform: uppercase !important; letter-spacing: 2px !important; }
    .calc-slider-val { color: #ffffff !important; font-weight: 500 !important; font-size: 12.5px !important; }
    
    .calc-native-input { -webkit-appearance: none !important; appearance: none !important; width: 100% !important; height: 2px !important; border-radius: 99px !important; background: rgba(255,255,255,0.12) !important; margin: 8px 0 !important; cursor: pointer !important; }
    .calc-native-input::-webkit-slider-thumb { -webkit-appearance: none !important; appearance: none !important; width: 12px !important; height: 12px !important; border-radius: 50% !important; background: #ffffff !important; box-shadow: 0 3px 8px rgba(0,0,0,0.4) !important; transition: transform 0.2s ease !important; }
    .calc-native-input::-webkit-slider-thumb:hover { transform: scale(1.3) !important; }
    
    .calc-check-row { display: flex !important; align-items: center !important; gap: 10px !important; margin: 14px 0 14px 0 !important; cursor: pointer !important; user-select: none !important; font-size: 12.5px !important; color: rgba(255,255,255,0.6) !important; font-weight: 300 !important; }
    .calc-check-box { width: 16px !important; height: 16px !important; border-radius: 5px !important; border: 1px solid rgba(255,255,255,0.15) !important; background: rgba(255,255,255,0.02) !important; display: flex !important; align-items: center !important; justify-content: center !important; color: transparent !important; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    .calc-check-box.checked { background: #ffffff !important; border-color: #ffffff !important; color: #0c0a09 !important; }
    
    .calc-summary-card { background: rgba(255,255,255,0.01) !important; border: 1px solid rgba(255,255,255,0.04) !important; border-radius: 18px !important; padding: 16px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; max-height: 220px; overflow-y: auto; }
    .calc-summary-line { display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 12px !important; color: rgba(255,255,255,0.45) !important; font-weight: 300 !important; }
    .calc-summary-line strong { color: rgba(255,255,255,0.9) !important; font-weight: 400 !important; }
    .calc-total-headline { display: flex !important; flex-direction: column !important; gap: 2px !important; border-top: 1px solid rgba(255,255,255,0.08) !important; padding-top: 12px !important; margin-top: 2px !important; }
    
    @media (max-width: 768px) {
      #immersive-canvas-nav1        { top: auto !important; left: 20px !important; right: 20px !important; bottom: 20px !important; }
      #immersive-canvas-nav2        { top: auto !important; left: 20px !important; right: 20px !important; bottom: 20px !important; }
      .premium-directory-panel     { width: 100% !important; padding: 20px !important; border-radius: 22px !important; }
      .nav2-main-panel             { width: 100% !important; padding: 20px !important; border-radius: 22px !important; }
      #hud-cost-calculator-root    { width: calc(100% - 40px) !important; right: 20px !important; left: 20px !important; bottom: 20px !important; padding: 20px !important; border-radius: 22px !important; }
      #close-fullscreen-floorplan-btn { bottom: 20px !important; right: 20px !important; width: calc(100% - 40px) !important; justify-content: center !important; }
    }
  `;
  document.head.appendChild(styleTag);

  /* ==========================================================================
     ─── BUILD NAV 1 VIEW DOM ───
     ========================================================================== */
  var canvasNav1 = document.createElement('div');
  canvasNav1.id = 'immersive-canvas-nav1';
  canvasNav1.innerHTML = `
    <div class="premium-directory-panel">
      <div class="header-row-nav1">
        <div class="icon-badge-box"><i data-lucide="compass" style="width:16px;height:16px;"></i></div>
        <div class="meta-text-block">
          <span class="meta-subtitle">Active Level</span>
          <span class="meta-title" id="active-floor-title">--</span>
        </div>
      </div>
      <div class="carousel-container">
        <button class="nav-arrow-btn" id="caro-prev-btn" type="button"><i data-lucide="chevron-left" style="width:16px;height:16px;"></i></button>
        <div class="carousel-track" id="caro-floor-track"></div>
        <button class="nav-arrow-btn" id="caro-next-btn" type="button"><i data-lucide="chevron-right" style="width:16px;height:16px;"></i></button>
      </div>
      
      <div class="hud-action-footer-row">
        <button class="hud-footer-action-btn" id="nav1-action-floorplan" type="button">
          <i data-lucide="map" style="width:13px;height:13px;"></i><span>Floorplan</span>
        </button>
        <button class="hud-footer-action-btn" id="nav1-action-calc" type="button">
          <i data-lucide="calculator" style="width:13px;height:13px;"></i><span>Calculator</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(canvasNav1);

  /* ==========================================================================
     ─── BUILD NAV 2 VIEW DOM ───
     ========================================================================== */
  var canvasNav2 = document.createElement('div');
  canvasNav2.id = 'immersive-canvas-nav2';
  canvasNav2.innerHTML = `
    <div class="nav2-main-panel">
      <div class="nav2-header-row">
        <div class="icon-badge-box"><i data-lucide="layout-grid" style="width:16px;height:16px;"></i></div>
        <div class="meta-text-block">
          <span class="nav2-title" id="room-title">--</span>
        </div>
      </div>
      <p class="nav2-desc" id="room-description">--</p>
      <div class="nav2-metrics-grid" id="metrics-grid"></div>
      
      <div class="nav2-blueprint-section">
        <span class="nav2-section-label">Target Fit-out Blueprint</span>
        <div class="nav2-blueprint-grid" id="nav2-blueprint-buttons-track"></div>
      </div>

      <div class="hud-action-footer-row">
        <button class="hud-footer-action-btn" id="nav2-action-floorplan" type="button">
          <i data-lucide="map" style="width:13px;height:13px;"></i><span>Floorplan</span>
        </button>
        <button class="hud-footer-action-btn" id="nav2-action-calc" type="button">
          <i data-lucide="calculator" style="width:13px;height:13px;"></i><span>Calculator</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(canvasNav2);

  /* ==========================================================================
     ─── BUILD THE COST CALCULATOR PANEL DOM ───
     ========================================================================== */
  var calcContainer = document.createElement('div');
  calcContainer.id = 'hud-cost-calculator-root';
  calcContainer.innerHTML = `
    <button id="hud-calc-close-x" class="calc-absolute-close-btn" type="button"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
    
    <div style="display:flex; align-items:center; gap:14px; margin-bottom:20px; padding-right:32px;">
      <div class="icon-badge-box" style="width:36px; height:36px;"><i data-lucide="calculator" style="width:16px;height:16px;color:#fff;"></i></div>
      <div style="display:flex; flex-direction:column;">
        <span style="font-family:'Inter', sans-serif; font-size:9px; font-weight:400; color:rgba(255,255,255,0.4); letter-spacing:2px; text-transform:uppercase;">Cost Profile Tool</span>
        <span style="font-family:'Marcellus', serif; font-size:17px; font-weight:400; letter-spacing:1.5px; color:#fff; margin-top:2px;">LEASE & FIT-OUT</span>
      </div>
    </div>

    <div class="calc-slider-pack">
      <div class="calc-slider-meta">
        <span class="calc-slider-lbl">Usable Area</span>
        <span class="calc-slider-val" id="calc-val-area">0 Sq Ft</span>
      </div>
      <input type="range" id="calc-slide-area" class="calc-native-input" min="2500" max="45000" step="500">
    </div>

    <div class="calc-slider-pack">
      <div class="calc-slider-meta">
        <span class="calc-slider-lbl">Base Rental Rate</span>
        <span class="calc-slider-val" id="calc-val-rent">₱0 / Sq Ft</span>
      </div>
      <input type="range" id="calc-slide-rent" class="calc-native-input" min="30" max="180" step="5">
    </div>

    <div class="calc-slider-pack">
      <div class="calc-slider-meta">
        <span class="calc-slider-lbl">CAM Rate</span>
        <span class="calc-slider-val" id="calc-val-cam">₱0 / Sq Ft</span>
      </div>
      <input type="range" id="calc-slide-cam" class="calc-native-input" min="0" max="30" step="1">
    </div>

    <div class="calc-slider-pack">
      <div class="calc-slider-meta">
        <span class="calc-slider-lbl">Lease Term</span>
        <span class="calc-slider-val" id="calc-val-term">0 Months</span>
      </div>
      <input type="range" id="calc-slide-term" class="calc-native-input" min="12" max="120" step="12">
    </div>

    <div class="calc-check-row" id="calc-toggle-amortize">
      <div class="calc-check-box" id="calc-check-node"><i data-lucide="check" style="width:11px;height:11px;stroke-width:3px;"></i></div>
      <span>Amortize fit-out blueprint over lease term</span>
    </div>

    <div class="calc-summary-card">
      <div class="calc-summary-line"><span>Base Monthly Rent</span><strong id="summary-base-rent">₱0</strong></div>
      <div class="calc-summary-line"><span>Monthly CAM Fees</span><strong id="summary-cam-fees">₱0</strong></div>
      <div class="calc-summary-line"><span>Estimated Total CAPEX Fit-Out</span><strong id="summary-fitout-capex">₱0</strong></div>
      <div class="calc-summary-line"><span>Security Deposit (${state.calc.securityDepositMonths} mo.)</span><strong id="summary-security-deposit">₱0</strong></div>
      <div class="calc-summary-line"><span>Advance Rent (${state.calc.advanceRentMonths} mo.)</span><strong id="summary-advance-rent">₱0</strong></div>
      <div class="calc-summary-line"><span>Total Initial Upfront Cash Outlay</span><strong id="summary-upfront-cash" style="color: #f59e0b;">₱0</strong></div>
      
      <div class="calc-total-headline">
        <span style="font-family:'Inter', sans-serif; font-size:9px; text-transform:uppercase; font-weight:400; letter-spacing:2px; color:rgba(255,255,255,0.4);" id="monthly-outlay-label">Estimated Monthly Outlay</span>
        <span style="font-family:'Inter', sans-serif; font-size:24px; font-weight:300; color:#ffffff; letter-spacing:-0.5px; margin-top:2px;" id="summary-total-monthly">₱0</span>
      </div>
    </div>
  `;
  document.body.appendChild(calcContainer);

  /* ==========================================================================
     ─── RUNTIME ENGINES ───
     ========================================================================== */

  function renderCarouselNav1() {
    var track = sel('caro-floor-track');
    if (!track) return;
    track.innerHTML = '';

    FLOORS.forEach(function (floor) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'floor-caro-item' + (state.activeFloorId === floor.id ? ' is-active-level' : '');
      btn.textContent = floor.shortTitle;
      btn.onmousedown = function (e) {
        e.preventDefault();
        state.activeFloorId = floor.id;
        updateHUDStateNav1(true);
      };
      track.appendChild(btn);
    });
  }

  function updateHUDStateNav1(shouldJump) {
    setText('active-floor-title', getFloor().title);
    renderCarouselNav1();
    refreshIcons();
    if (shouldJump) goToPanorama(getFloor().panoramaName, false);
  }

  function checkHUDVisibilityNav1() {
    var canvas = sel('immersive-canvas-nav1');
    if (!canvas) return;

    if (state.nav1Visible) {
      if (canvas.style.display !== 'block') canvas.style.setProperty('display', 'block', 'important');
      if (!canvas.classList.contains('hud-ready')) {
        setTimeout(function () { canvas.classList.add('hud-ready'); }, 10);
      }
    } else {
      if (canvas.classList.contains('hud-ready')) canvas.classList.remove('hud-ready');
      if (canvas.style.display !== 'none') canvas.style.setProperty('display', 'none', 'important');
    }

    var player = getPlayer();
    if (!player) return;
    try {
      var currentMedia = player.getCurrentMedia ? player.getCurrentMedia() : (player.currentMedia || null);
      var rawName = currentMedia && (currentMedia.name || currentMedia.title || currentMedia.id);
      if (rawName) {
        var panKey = normalizeMediaKey(rawName);
        var match = FLOORS.find(function (f) { 
          return panKey.includes(normalizeMediaKey(f.panoramaName)); 
        });
        
        if (match) {
          if (state.activeFloorId !== match.id) {
            state.activeFloorId = match.id;
            updateHUDStateNav1(false);
          }
        } else {
          if (state.activeFloorId !== 'floor-g') {
            state.activeFloorId = 'floor-g';
            updateHUDStateNav1(false);
          }
        }
      }
    } catch (e) {}
  }

  function renderBlueprintGridNav2() {
    var track = sel('nav2-blueprint-buttons-track');
    if (!track) return;
    track.innerHTML = '';

    BLUEPRINT_OPTIONS.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      
      var isActive = (state.calc.currentScenarioId === opt.id);
      btn.className = 'nav2-blueprint-btn' + (isActive ? ' is-active' : '');
      btn.textContent = opt.label;
      
      btn.onclick = function (e) {
        e.preventDefault();
        state.calc.currentScenarioId = opt.id;
        state.calc.fitoutCostPerSqFt = opt.cost; // dynamically update rate mapping your design
        renderBlueprintGridNav2();
        updateCalculator();
        renderAllNav2();
        
        if (opt.panoramaName) {
          goToPanorama(opt.panoramaName, false);
        }
      };
      track.appendChild(btn);
    });
  }

  function renderMetrics() {
    var grid = sel('metrics-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var blueprint = getActiveBlueprint();
    
    if (!blueprint.metrics) return;
    
    blueprint.metrics.forEach(function (metric) {
      var tile = document.createElement('div');
      tile.className = 'nav2-metric-tile';
      tile.innerHTML = `
        <div class="nav2-metric-label">
          <i data-lucide="${metric.icon || 'grid'}" style="width:12px;height:12px;color:rgba(255,255,255,0.4);"></i>
          <span>${metric.label}</span>
        </div>
        <span class="nav2-metric-value">${metric.value}</span>
      `;
      grid.appendChild(tile);
    });
  }

  function renderAllNav2() {
    var blueprint = getActiveBlueprint();
    setText('room-title', blueprint.label.toUpperCase());
    setText('room-description', blueprint.description || '');
    renderMetrics();
    renderBlueprintGridNav2();
    refreshIcons();
  }

  function checkHUDVisibilityNav2() {
    var canvas = sel('immersive-canvas-nav2');
    if (!canvas) return;

    if (state.nav2Visible) {
      if (canvas.style.display !== 'block') canvas.style.setProperty('display', 'block', 'important');
      if (!canvas.classList.contains('hud-ready')) {
        setTimeout(function () { canvas.classList.add('hud-ready'); }, 10);
      }
    } else {
      if (canvas.classList.contains('hud-ready')) canvas.classList.remove('hud-ready');
      if (canvas.style.display !== 'none') canvas.style.setProperty('display', 'none', 'important');
    }

    var player = getPlayer();
    if (!player) return;
    
    try {
      var currentMedia = player.getCurrentMedia ? player.getCurrentMedia() : (player.currentMedia || null);
      var rawName = currentMedia && (currentMedia.name || currentMedia.title || currentMedia.id);
      
      if (rawName) {
        var panKey = normalizeMediaKey(rawName);
        var matchInBlueprints = BLUEPRINT_OPTIONS.find(function (b) { return panKey.includes(normalizeMediaKey(b.panoramaName)); });
        
        if (matchInBlueprints) {
          if (state.calc.currentScenarioId !== matchInBlueprints.id) {
            state.calc.currentScenarioId = matchInBlueprints.id;
            state.calc.fitoutCostPerSqFt = matchInBlueprints.cost;
            renderAllNav2();
            updateCalculator();
          }
        }
      }
    } catch (e) {}
  }

  function initCalculatorDOMBindings() {
    sel('calc-slide-area').value = state.calc.usableAreaSqFt;
    sel('calc-slide-rent').value = state.calc.baseRentalRate;
    sel('calc-slide-cam').value = state.calc.camRate;
    sel('calc-slide-term').value = state.calc.leaseTermMonths;
    
    sel('calc-slide-area').oninput = function() {
      state.calc.usableAreaSqFt = parseInt(this.value) || 0;
      updateCalculator();
    };
    sel('calc-slide-rent').oninput = function() {
      state.calc.baseRentalRate = parseInt(this.value) || 0;
      updateCalculator();
    };
    sel('calc-slide-cam').oninput = function() {
      state.calc.camRate = parseInt(this.value) || 0;
      updateCalculator();
    };
    sel('calc-slide-term').oninput = function() {
      state.calc.leaseTermMonths = parseInt(this.value) || 0;
      updateCalculator();
    };
    sel('calc-toggle-amortize').onclick = function() {
      state.calc.includeFitoutAllocation = !state.calc.includeFitoutAllocation;
      updateCalculator();
    };
    sel('hud-calc-close-x').onclick = function() {
      window.toggleImmersiveCalculator?.();
    };
  }

  function updateCalculator() {
    var area = state.calc.usableAreaSqFt;
    var rentRate = state.calc.baseRentalRate;
    var camRate = state.calc.camRate;
    var leaseTerm = state.calc.leaseTermMonths;
    
    // Explicit dynamic fallback assignment via scenario logic context
    state.calc.fitoutCostPerSqFt = CALC_SCENARIO_COSTS[state.calc.currentScenarioId] || 120;
    var fitoutRate = state.calc.fitoutCostPerSqFt;

    // Render operational state text views
    setText('calc-val-area', area.toLocaleString() + ' Sq Ft');
    setText('calc-val-rent', '₱' + rentRate + ' / Sq Ft');
    setText('calc-val-cam', '₱' + camRate + ' / Sq Ft');
    setText('calc-val-term', leaseTerm + ' Months');

    var checkNode = sel('calc-check-node');
    if (checkNode) {
      if (state.calc.includeFitoutAllocation) checkNode.classList.add('checked');
      else checkNode.classList.remove('checked');
    }

    // Computation Mechanics
    var monthlyBaseRent = area * rentRate;
    var monthlyCamFees = area * camRate;
    var totalCapexFitout = area * fitoutRate;
    
    var securityDeposit = monthlyBaseRent * state.calc.securityDepositMonths;
    var advanceRent = monthlyBaseRent * state.calc.advanceRentMonths;
    
    // Upfront cash outlays always explicitly require raw structure fitout cost if not amortized
    var upfrontCashOutlay = securityDeposit + advanceRent + (state.calc.includeFitoutAllocation ? 0 : totalCapexFitout);
    
    // Amortization allocation check logic configuration
    var monthlyAmortizedFitout = state.calc.includeFitoutAllocation ? (totalCapexFitout / leaseTerm) : 0;
    var totalEstimatedMonthlyOutlay = monthlyBaseRent + monthlyCamFees + monthlyAmortizedFitout;

    // Set UI outputs
    setText('summary-base-rent', '₱' + Math.round(monthlyBaseRent).toLocaleString());
    setText('summary-cam-fees', '₱' + Math.round(monthlyCamFees).toLocaleString());
    setText('summary-fitout-capex', '₱' + Math.round(totalCapexFitout).toLocaleString());
    setText('summary-security-deposit', '₱' + Math.round(securityDeposit).toLocaleString());
    setText('summary-advance-rent', '₱' + Math.round(advanceRent).toLocaleString());
    setText('summary-upfront-cash', '₱' + Math.round(upfrontCashOutlay).toLocaleString());
    
    setText('monthly-outlay-label', state.calc.includeFitoutAllocation ? "Est. Monthly Outlay (With Fitout)" : "Est. Monthly Outlay (Rent + CAM)");
    setText('summary-total-monthly', '₱' + Math.round(totalEstimatedMonthlyOutlay).toLocaleString());
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  function setupUnifiedEvents() {
    sel('caro-prev-btn').onclick = function () {
      var idx = FLOORS.findIndex(function (f) { return f.id === state.activeFloorId; });
      state.activeFloorId = idx > 0 ? FLOORS[idx - 1].id : FLOORS[FLOORS.length - 1].id;
      updateHUDStateNav1(true);
    };
    sel('caro-next-btn').onclick = function () {
      var idx = FLOORS.findIndex(function (f) { return f.id === state.activeFloorId; });
      state.activeFloorId = idx < FLOORS.length - 1 ? FLOORS[idx + 1].id : FLOORS[0].id;
      updateHUDStateNav1(true);
    };

    sel('nav1-action-floorplan').onclick = function(e) {
      e.preventDefault();
      openExternalFloorplanIframe();
    };
    sel('nav1-action-calc').onclick = function(e) {
      e.preventDefault();
      window.toggleImmersiveCalculator?.();
    };

    sel('nav2-action-floorplan').onclick = function(e) {
      e.preventDefault();
      openExternalFloorplanIframe();
    };
    sel('nav2-action-calc').onclick = function(e) {
      e.preventDefault();
      window.toggleImmersiveCalculator?.();
    };

    initCalculatorDOMBindings();
  }

  /* ==========================================================================
     ─── GLOBAL INSTANT API DEFINITIONS (RESILIENT DESIGN) ───
     ========================================================================== */
  window.showNavigation1 = function () {
    state.nav2Visible = false;
    state.nav1Visible = true;
    
    var canvas1 = sel('immersive-canvas-nav1');
    if (canvas1) {
      canvas1.style.setProperty('display', 'block', 'important');
      setTimeout(function () { canvas1.classList.add('hud-ready'); }, 20);
    }
    updateHUDStateNav1(false);
  };

  window.hideNavigation1 = function () {
    state.nav1Visible = false;
    var canvas1 = sel('immersive-canvas-nav1');
    if (canvas1) {
      canvas1.classList.remove('hud-ready');
      canvas1.style.setProperty('display', 'none', 'important');
    }
  };

  window.showNavigation2 = function () {
    state.nav1Visible = false;
    state.nav2Visible = true;
    
    var canvas2 = sel('immersive-canvas-nav2');
    if (canvas2) {
      canvas2.style.setProperty('display', 'block', 'important');
      setTimeout(function () { canvas2.classList.add('hud-ready'); }, 20);
    }
    checkHUDVisibilityNav2();
    renderAllNav2();
  };

  window.hideNavigation2 = function () {
    state.nav2Visible = false;
    var canvas2 = sel('immersive-canvas-nav2');
    if (canvas2) {
      canvas2.classList.remove('hud-ready');
      canvas2.style.setProperty('display', 'none', 'important');
    }
  };

  window.toggleImmersiveCalculator = function () {
    var root = sel('hud-cost-calculator-root');
    if (!root) return;
    
    state.calc.visible = !state.calc.visible;
    
    if (state.calc.visible) {
      root.style.setProperty('display', 'block', 'important');
      setTimeout(function() {
        root.classList.add('is-visible');
        updateCalculator();
      }, 20);
    } else {
      root.classList.remove('is-visible');
      root.style.setProperty('display', 'none', 'important');
    }
    refreshIcons();
  };

  /* ==========================================================================
     ─── DEPENDENCY LOADER ───
     ========================================================================== */
  var loadedScripts = 0;
  function dependencyReady() {
    loadedScripts++;
    if (loadedScripts < 2) return;

    setupUnifiedEvents();
    updateCalculator();
    setInterval(checkHUDVisibilityNav1, 150);
    setInterval(checkHUDVisibilityNav2, 150);
  }

  function loadScript(src) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = dependencyReady;
    document.head.appendChild(script);
  }

  loadScript('https://cdn.tailwindcss.com');
  loadScript('https://unpkg.com/lucide@latest');

})();